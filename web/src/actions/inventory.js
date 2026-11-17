"use server";

import { refresh } from "next/cache";
import mongoose from "mongoose";
import { z } from "zod";
import { getContext, requireActiveStore, assertCanManage } from "@/lib/auth";
import { escapeRegex } from "@/lib/utils";
import { toPlain } from "@/lib/format";
import { Product, Inventory, StockMovement, Store } from "@/models";

const ProductSchema = z.object({
  category: z.enum(["frame", "lens", "contact_lens", "solution", "sunglass", "misc"]),
  name: z.string().trim().min(2, "Enter product name"),
  brand: z.string().trim().optional().default(""),
  modelNo: z.string().trim().optional().default(""),
  barcode: z.string().trim().optional().default(""),
  sellingPrice: z.coerce.number().min(0, "Enter price"),
  costPrice: z.union([z.literal(""), z.coerce.number().min(0)]).optional(),
  gstPercent: z.coerce.number().min(0).max(28),
  hsn: z.string().optional().default(""),
  trackStock: z.boolean().default(true),
  attributes: z
    .object({
      material: z.string().optional(),
      colour: z.string().optional(),
      shape: z.string().optional(),
      size: z.string().optional(),
      index: z.string().optional(),
      coating: z.string().optional(),
    })
    .default({}),
  openingQty: z.union([z.literal(""), z.coerce.number().int().min(0)]).optional(),
  minQty: z.union([z.literal(""), z.coerce.number().int().min(0)]).optional(),
});

export async function saveProduct(id, data) {
  const ctx = await getContext();
  try {
    assertCanManage(ctx);
  } catch (e) {
    return { error: e.message };
  }
  const parsed = ProductSchema.safeParse(data);
  if (!parsed.success) {
    const errors = {};
    for (const i of parsed.error.issues) errors[i.path[0]] ??= i.message;
    return { errors };
  }
  const { openingQty, minQty, costPrice, ...d } = parsed.data;
  const doc = { ...d, mrp: d.sellingPrice, costPrice: costPrice === "" ? undefined : costPrice };

  let product;
  if (id) {
    product = await Product.findByIdAndUpdate(id, doc, { new: true }).lean();
  } else {
    if (!doc.barcode) doc.barcode = `29${Date.now().toString().slice(-10)}`;
    product = await Product.create(doc);
    // create inventory rows for all stores so the product shows up everywhere
    const storeIds = (await Store.find({ isActive: true }).select("_id").lean()).map((s) => s._id);
    await Inventory.insertMany(
      storeIds.map((sid) => ({
        productId: product._id,
        storeId: sid,
        qty: ctx.activeStoreId && String(sid) === ctx.activeStoreId ? Number(openingQty) || 0 : 0,
        minQty: minQty === "" || minQty === undefined ? 2 : minQty,
      }))
    );
    if (ctx.activeStoreId && Number(openingQty) > 0) {
      await StockMovement.create({
        productId: product._id,
        storeId: ctx.activeStoreId,
        type: "purchase",
        qty: Number(openingQty),
        note: "Opening stock",
        userId: ctx.user.id,
      });
    }
  }
  refresh();
  return { product: toPlain(product) };
}

/** Quick stock in / adjustment for the active store. qty can be negative for corrections. */
export async function adjustStock(productId, qty, note = "") {
  const ctx = await getContext();
  let storeId;
  try {
    storeId = requireActiveStore(ctx);
  } catch (e) {
    return { error: e.message };
  }
  const n = Math.trunc(Number(qty));
  if (!n) return { error: "Enter a quantity" };

  const inv = await Inventory.findOneAndUpdate(
    { productId, storeId },
    { $inc: { qty: n }, $setOnInsert: { minQty: 2 } },
    { upsert: true, new: true }
  );
  if (inv.qty < 0) {
    await Inventory.updateOne({ _id: inv._id }, { $inc: { qty: -n } });
    return { error: "Stock cannot go below zero" };
  }
  await StockMovement.create({
    productId,
    storeId,
    type: n > 0 ? "purchase" : "adjust",
    qty: n,
    note: note || (n > 0 ? "Stock in" : "Adjustment"),
    userId: ctx.user.id,
  });
  refresh();
  return { qty: inv.qty };
}

/** Product typeahead for New Sale: returns stock in the active store. */
export async function searchProducts(query, category) {
  const ctx = await getContext();
  const q = String(query ?? "").trim();
  const filter = { isActive: true };
  if (category && category !== "all") filter.category = category;
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ name: rx }, { brand: rx }, { modelNo: rx }, { barcode: q }, { sku: q }];
  }
  const products = await Product.find(filter).sort({ category: 1, brand: 1, name: 1 }).limit(q ? 12 : 30).lean();
  const storeId = ctx.activeStoreId ? new mongoose.Types.ObjectId(ctx.activeStoreId) : null;
  const stock = storeId
    ? await Inventory.find({ storeId, productId: { $in: products.map((p) => p._id) } }).lean()
    : [];
  const stockMap = Object.fromEntries(stock.map((s) => [String(s.productId), s.qty]));
  return toPlain(products.map((p) => ({ ...p, stock: stockMap[String(p._id)] ?? 0 })));
}
