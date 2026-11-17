"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getContext, requireActiveStore } from "@/lib/auth";
import { escapeRegex } from "@/lib/utils";
import { toPlain } from "@/lib/format";
import mongoose from "mongoose";
import { createPrescriptionRecord } from "@/lib/prescriptions";
import { Customer, Prescription, Invoice, nextSequence } from "@/models";

const CustomerSchema = z.object({
  name: z.string().trim().min(2, "Enter customer name").transform((s) => s.toUpperCase()),
  mobile: z
    .string()
    .trim()
    .transform((s) => s.replace(/\D/g, "").slice(-10))
    .refine((s) => /^[6-9]\d{9}$/.test(s), "Enter a valid 10-digit mobile number"),
  mobile2: z.string().trim().optional().default(""),
  email: z.union([z.literal(""), z.email("Invalid email")]).optional().default(""),
  gender: z.enum(["male", "female", "other", ""]).optional().default(""),
  age: z.union([z.literal(""), z.coerce.number().int().min(0).max(120)]).optional(),
  dob: z.string().optional().default(""),
  category: z.string().optional().default(""),
  referDoctor: z.string().optional().default(""),
  address: z.string().optional().default(""),
  remark: z.string().optional().default(""),
});

function fieldErrors(error) {
  const out = {};
  for (const issue of error.issues) out[issue.path[0]] ??= issue.message;
  return out;
}

/** Create or update a customer. Returns { customer } or { errors }. */
export async function saveCustomer(id, data) {
  const ctx = await getContext();
  const parsed = CustomerSchema.safeParse(data);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const d = parsed.data;
  const doc = {
    ...d,
    age: d.age === "" || d.age === undefined ? undefined : d.age,
    dob: d.dob ? new Date(d.dob) : undefined,
  };

  if (!id) {
    const dupe = await Customer.findOne({ mobile: d.mobile, name: d.name }).lean();
    if (dupe) return { errors: { mobile: "A customer with this name and mobile already exists" } };
  }

  let customer;
  if (id) {
    customer = await Customer.findByIdAndUpdate(id, doc, { new: true }).lean();
  } else {
    customer = await Customer.create({
      ...doc,
      customerNo: await nextSequence("customer"),
      createdAtStoreId: ctx.activeStoreId ?? ctx.allowedStoreIds[0],
      lastVisitAt: new Date(),
    });
  }
  refresh();
  return { customer: toPlain(customer) };
}

/** Typeahead for the New Sale screen: match by mobile, name or customer number. */
export async function findCustomers(query) {
  await getContext();
  const q = String(query ?? "").trim();
  if (q.length < 2) return [];
  const digits = q.replace(/\D/g, "");
  const or = [{ name: new RegExp(escapeRegex(q), "i") }];
  if (digits.length >= 3) or.push({ mobile: new RegExp(escapeRegex(digits)) });
  if (/^\d{1,6}$/.test(q)) or.push({ customerNo: Number(q) });

  const customers = await Customer.find({ $or: or }).sort({ lastVisitAt: -1 }).limit(8).lean();
  return toPlain(customers);
}

/** Everything the sale screen needs once a customer is picked. */
export async function getCustomerForSale(customerId) {
  const ctx = await getContext();
  if (!mongoose.isValidObjectId(customerId)) return null;
  const cid = new mongoose.Types.ObjectId(customerId);
  const scoped = { customerId: cid, status: "confirmed", storeId: { $in: ctx.allowedStoreIds } };
  const [customer, lastRx, rxCount, agg, lastInvoice] = await Promise.all([
    Customer.findById(cid).lean(),
    Prescription.findOne({ customerId: cid }).sort({ visitDate: -1, createdAt: -1 }).lean(),
    Prescription.countDocuments({ customerId: cid }),
    Invoice.aggregate([
      { $match: scoped },
      { $group: { _id: null, bills: { $sum: 1 }, spent: { $sum: "$grandTotal" }, balance: { $sum: "$balance" }, dueBills: { $sum: { $cond: [{ $gt: ["$balance", 0] }, 1, 0] } } } },
    ]),
    Invoice.findOne(scoped).sort({ date: -1 }).select("invoiceNo date grandTotal items.name items.category").lean(),
  ]);
  if (!customer) return null;
  const a = agg[0] ?? { bills: 0, spent: 0, balance: 0, dueBills: 0 };
  return toPlain({
    customer,
    lastRx,
    lastInvoice,
    stats: { visits: rxCount, bills: a.bills, spent: a.spent },
    due: { balance: a.balance, count: a.dueBills },
  });
}

export async function savePrescription(customerId, rx) {
  const ctx = await getContext();
  try {
    const storeId = requireActiveStore(ctx);
    const doc = await createPrescriptionRecord(customerId, rx, storeId);
    refresh();
    return { prescription: toPlain(doc) };
  } catch (e) {
    return { error: e.message };
  }
}
