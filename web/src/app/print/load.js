import "server-only";
import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { getContext, storeScope } from "@/lib/auth";
import { Invoice, Prescription, Store, Customer } from "@/models";

export async function loadInvoiceForPrint(params) {
  const ctx = await getContext();
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();
  const inv = await Invoice.findOne({ _id: id, ...storeScope(ctx) }).lean();
  if (!inv) notFound();
  const [store, rx, customer] = await Promise.all([
    Store.findById(inv.storeId).lean(),
    inv.prescriptionId ? Prescription.findById(inv.prescriptionId).lean() : null,
    Customer.findById(inv.customerId).lean(),
  ]);
  return { inv, store, rx, customer };
}
