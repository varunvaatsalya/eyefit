"use server";

import { getContext, storeScope } from "@/lib/auth";
import { escapeRegex } from "@/lib/utils";
import { Customer, Invoice, Product } from "@/models";

export async function globalSearch(query) {
  const ctx = await getContext();
  const q = String(query ?? "").trim();
  if (q.length < 2) return { customers: [], invoices: [], products: [] };

  const rx = new RegExp(escapeRegex(q), "i");
  const isNum = /^\d+$/.test(q);

  const [customers, invoices, products] = await Promise.all([
    Customer.find({
      $or: [{ name: rx }, { mobile: rx }, ...(isNum ? [{ customerNo: Number(q) }] : [])],
    })
      .sort({ lastVisitAt: -1 })
      .limit(6)
      .select("name mobile customerNo")
      .lean(),
    Invoice.find({ ...storeScope(ctx), $or: [{ invoiceNo: rx }, { "customerSnapshot.mobile": rx }] })
      .sort({ date: -1 })
      .limit(5)
      .select("invoiceNo grandTotal customerSnapshot.name date")
      .lean(),
    Product.find({ isActive: true, $or: [{ name: rx }, { brand: rx }, { modelNo: rx }, { barcode: q }] })
      .limit(5)
      .select("name category sellingPrice")
      .lean(),
  ]);

  return JSON.parse(JSON.stringify({ customers, invoices, products }));
}
