"use server";

import { refresh } from "next/cache";
import mongoose from "mongoose";
import { z } from "zod";
import { getContext, requireActiveStore, storeScope, assertCanManage } from "@/lib/auth";
import { calcTotals, sumPayments } from "@/lib/billing";
import { createPrescriptionRecord } from "@/lib/prescriptions";
import { Customer, Product, Inventory, StockMovement, Invoice, Store, nextSequence } from "@/models";

const ItemSchema = z.object({
  productId: z.string().optional().nullable(),
  category: z.string(),
  name: z.string().trim().min(1, "Item name missing"),
  brand: z.string().optional().default(""),
  modelNo: z.string().optional().default(""),
  details: z.string().optional().default(""),
  rate: z.coerce.number().min(0),
  qty: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  discountPct: z.coerce.number().min(0).max(100).default(0),
  gstPct: z.coerce.number().min(0).max(28).default(0),
});

const SaleSchema = z.object({
  customerId: z.string().optional().nullable(),
  newCustomer: z
    .object({
      name: z.string().trim().min(2, "Enter customer name"),
      mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile"),
      gender: z.string().optional().default(""),
      age: z.union([z.literal(""), z.coerce.number().int().min(0).max(120)]).optional(),
    })
    .optional()
    .nullable(),
  rx: z.any().optional().nullable(),
  prescriptionId: z.string().optional().nullable(),
  items: z.array(ItemSchema).min(1, "Add at least one item"),
  extraDiscount: z.coerce.number().min(0).default(0),
  payments: z
    .array(z.object({ mode: z.enum(["cash", "upi", "card", "cheque"]), amount: z.coerce.number().min(0), ref: z.string().optional().default("") }))
    .default([]),
  deliveryDate: z.string().optional().nullable(),
  deliveryStatus: z.enum(["pending", "in_lab", "ready", "delivered"]).default("pending"),
  notes: z.string().optional().default(""),
  whatsapp: z.object({ sendBill: z.boolean().default(false), dueReminder: z.boolean().default(false) }).default({ sendBill: false, dueReminder: false }),
});

/** Run fn inside a transaction when the DB supports it (replica set / Atlas), else run it directly. */
async function withTransaction(fn) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (e) {
    if (/replica set|Transaction numbers/i.test(e.message)) return fn(null);
    throw e;
  } finally {
    await session.endSession();
  }
}

class SaleError extends Error {}

export async function createSale(payload) {
  const ctx = await getContext();
  let storeId;
  try {
    storeId = requireActiveStore(ctx);
  } catch (e) {
    return { error: e.message };
  }

  const parsed = SaleSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (!d.customerId && !d.newCustomer) return { error: "Select or add a customer" };

  // Totals are always recalculated on the server.
  const totals = calcTotals(d.items, d.extraDiscount);
  const payments = d.payments.filter((p) => p.amount > 0);
  const paid = sumPayments(payments);
  if (paid > totals.grandTotal + 0.001) return { error: "Payment is more than the bill amount" };

  // Snapshot product details from DB for catalogue items.
  const productIds = d.items.map((i) => i.productId).filter(Boolean);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = Object.fromEntries(products.map((p) => [String(p._id), p]));

  let result;
  try {
    result = await withTransaction(async (session) => {
      // 1. customer
      let customer;
      if (d.customerId) {
        customer = await Customer.findById(d.customerId).session(session).lean();
        if (!customer) throw new SaleError("Customer not found");
      } else {
        const nc = d.newCustomer;
        const [created] = await Customer.create(
          [
            {
              name: nc.name.toUpperCase(),
              mobile: nc.mobile,
              gender: nc.gender || "",
              age: nc.age === "" || nc.age === undefined ? undefined : nc.age,
              customerNo: await nextSequence("customer", session),
              createdAtStoreId: storeId,
              lastVisitAt: new Date(),
            },
          ],
          { session }
        );
        customer = created.toObject();
      }

      // 2. prescription (new eye test entered on this screen, or reuse an existing one)
      let prescriptionId = d.prescriptionId || undefined;
      if (d.rx) {
        const rxDoc = await createPrescriptionRecord(customer._id, d.rx, storeId, session);
        prescriptionId = rxDoc._id;
      }

      // 3. stock: group qty per product and decrement atomically (fails if not enough stock)
      const need = {};
      for (const it of d.items) {
        const p = it.productId && productMap[it.productId];
        if (p?.trackStock) need[it.productId] = (need[it.productId] ?? 0) + it.qty;
      }
      const invoiceId = new mongoose.Types.ObjectId();
      for (const [productId, qty] of Object.entries(need)) {
        const res = await Inventory.updateOne(
          { productId, storeId, qty: { $gte: qty } },
          { $inc: { qty: -qty } },
          { session }
        );
        if (res.modifiedCount === 0) {
          const have = await Inventory.findOne({ productId, storeId }).session(session).lean();
          throw new SaleError(`Not enough stock for ${productMap[productId].name} (available: ${have?.qty ?? 0})`);
        }
      }
      if (Object.keys(need).length) {
        await StockMovement.insertMany(
          Object.entries(need).map(([productId, qty]) => ({
            productId, storeId, type: "sale", qty: -qty, refId: invoiceId, userId: ctx.user.id,
          })),
          { session }
        );
      }

      // 4. invoice
      const store = await Store.findById(storeId).session(session).lean();
      const seq = await nextSequence(`invoice:${storeId}`, session);
      const invoiceNo = `${store.invoicePrefix}-${String(seq).padStart(5, "0")}`;
      const now = new Date();

      await Invoice.create(
        [
          {
            _id: invoiceId,
            invoiceNo,
            storeId,
            customerId: customer._id,
            customerSnapshot: { name: customer.name, mobile: customer.mobile, customerNo: customer.customerNo },
            prescriptionId,
            date: now,
            deliveryDate: d.deliveryDate ? new Date(d.deliveryDate) : now,
            items: totals.lines.map((l) => {
              const p = l.productId && productMap[l.productId];
              return {
                ...l,
                productId: p ? p._id : undefined,
                name: p ? p.name : l.name,
                brand: p ? p.brand : l.brand,
                modelNo: p ? p.modelNo : l.modelNo,
              };
            }),
            subTotal: totals.subTotal,
            itemDiscount: totals.itemDiscount,
            extraDiscount: totals.extraDiscount,
            gstTotal: totals.gstTotal,
            roundOff: totals.roundOff,
            grandTotal: totals.grandTotal,
            payments: payments.map((p) => ({ ...p, date: now, userId: ctx.user.id })),
            paidTotal: paid,
            balance: Math.round((totals.grandTotal - paid) * 100) / 100,
            deliveryStatus: d.deliveryStatus,
            notes: d.notes,
            whatsapp: d.whatsapp,
            createdBy: ctx.user.id,
          },
        ],
        { session }
      );
      await Customer.updateOne({ _id: customer._id }, { $set: { lastVisitAt: now } }, { session });
      return { id: String(invoiceId), invoiceNo };
    });
  } catch (e) {
    if (e instanceof SaleError) return { error: e.message };
    console.error("createSale failed", e);
    return { error: "Could not save the bill. Please try again." };
  }
  refresh();
  return result;
}

async function getScopedInvoice(ctx, id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Invoice.findOne({ _id: id, ...storeScope(ctx) });
}

export async function addPayment(invoiceId, { amount, mode, ref }) {
  const ctx = await getContext();
  const inv = await getScopedInvoice(ctx, invoiceId);
  if (!inv) return { error: "Bill not found" };
  if (inv.status === "cancelled") return { error: "Bill is cancelled" };
  const amt = Math.round(Number(amount) * 100) / 100;
  if (!(amt > 0)) return { error: "Enter an amount" };
  if (amt > inv.balance + 0.001) return { error: `Balance is only ₹${inv.balance}` };

  inv.payments.push({ mode, amount: amt, ref, date: new Date(), userId: ctx.user.id });
  inv.paidTotal = sumPayments(inv.payments);
  inv.balance = Math.round((inv.grandTotal - inv.paidTotal) * 100) / 100;
  await inv.save();
  refresh();
  return { ok: true, balance: inv.balance };
}

export async function setDeliveryStatus(invoiceId, status, { collectBalance } = {}) {
  const ctx = await getContext();
  if (!["pending", "in_lab", "ready", "delivered"].includes(status)) return { error: "Invalid status" };
  const inv = await getScopedInvoice(ctx, invoiceId);
  if (!inv) return { error: "Bill not found" };
  if (inv.status === "cancelled") return { error: "Bill is cancelled" };

  // One-click "Deliver & collect balance"
  if (collectBalance && inv.balance > 0) {
    inv.payments.push({ mode: collectBalance, amount: inv.balance, date: new Date(), userId: ctx.user.id });
    inv.paidTotal = sumPayments(inv.payments);
    inv.balance = 0;
  }
  inv.deliveryStatus = status;
  await inv.save();
  refresh();
  return { ok: true };
}

export async function cancelInvoice(invoiceId) {
  const ctx = await getContext();
  try {
    assertCanManage(ctx);
  } catch (e) {
    return { error: e.message };
  }
  const inv = await getScopedInvoice(ctx, invoiceId);
  if (!inv) return { error: "Bill not found" };
  if (inv.status === "cancelled") return { error: "Already cancelled" };

  await withTransaction(async (session) => {
    const sold = await StockMovement.find({ refId: inv._id, type: "sale" }).session(session).lean();
    for (const m of sold) {
      await Inventory.updateOne({ productId: m.productId, storeId: m.storeId }, { $inc: { qty: -m.qty } }, { session });
    }
    if (sold.length) {
      await StockMovement.insertMany(
        sold.map((m) => ({ productId: m.productId, storeId: m.storeId, type: "return", qty: -m.qty, refId: inv._id, note: `Cancelled ${inv.invoiceNo}`, userId: ctx.user.id })),
        { session }
      );
    }
    await Invoice.updateOne({ _id: inv._id }, { $set: { status: "cancelled" } }, { session });
  });
  refresh();
  return { ok: true };
}
