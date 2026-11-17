"use server";

import { getContext } from "@/lib/auth";
import { segmentContacts, SEGMENTS } from "@/lib/segments";
import { toPlain } from "@/lib/format";

/** Contacts for a segment (used for preview names and CSV export). */
export async function getSegmentContacts(segmentId) {
  const ctx = await getContext();
  if (!ctx.canManage) return { error: "Not allowed" };
  if (!SEGMENTS.some((s) => s.id === segmentId)) return { error: "Unknown segment" };
  const rows = await segmentContacts(segmentId, ctx);
  return { contacts: toPlain(rows.map((r) => ({ name: r.name, mobile: r.mobile, customerNo: r.customerNo }))) };
}
