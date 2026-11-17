"use server";

import { refresh } from "next/cache";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getContext, storeScope } from "@/lib/auth";
import { Enquiry, Store } from "@/models";

const EnquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  mobile: z
    .string()
    .trim()
    .transform((s) => s.replace(/\D/g, "").slice(-10))
    .refine((s) => /^[6-9]\d{9}$/.test(s), "Please enter a valid 10-digit mobile number"),
  storeId: z.string().optional().default(""),
  reason: z.enum(["eyetest", "frames", "contact_lens", "repair", "other"]).default("eyetest"),
  preferredDate: z.string().optional().default(""),
  message: z.string().trim().max(500).optional().default(""),
  website: z.string().optional().default(""), // honeypot: real users leave this empty
});

/** Public website form (no login). */
export async function submitEnquiry(_prev, formData) {
  const parsed = EnquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors = {};
    for (const i of parsed.error.issues) errors[i.path[0]] ??= i.message;
    return { errors, values: Object.fromEntries(formData) };
  }
  const d = parsed.data;
  if (d.website) return { ok: true }; // bot: pretend success, store nothing

  await connectDB();
  let storeId;
  if (d.storeId && mongoose.isValidObjectId(d.storeId) && (await Store.exists({ _id: d.storeId, isActive: true }))) {
    storeId = d.storeId;
  }
  await Enquiry.create({
    name: d.name,
    mobile: d.mobile,
    storeId,
    reason: d.reason,
    preferredDate: d.preferredDate ? new Date(d.preferredDate) : undefined,
    message: d.message,
  });
  return { ok: true, name: d.name.split(" ")[0] };
}

/** Panel: mark a website enquiry as contacted / closed. */
export async function setEnquiryStatus(id, status) {
  const ctx = await getContext();
  if (!["new", "contacted", "closed"].includes(status) || !mongoose.isValidObjectId(id)) return { error: "Invalid request" };
  const res = await Enquiry.updateOne({ _id: id, $or: [storeScope(ctx), { storeId: null }] }, { $set: { status } });
  if (!res.matchedCount) return { error: "Enquiry not found" };
  refresh();
  return { ok: true };
}
