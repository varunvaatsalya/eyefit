import "server-only";
import { subDays } from "date-fns";
import { Customer, Prescription, Invoice } from "@/models";

export const SEGMENTS = [
  { id: "all", label: "All customers", hint: "Everyone in the database" },
  { id: "birthday", label: "Birthday this month", hint: "Send wishes + offer" },
  { id: "eyetest", label: "Eye test due", hint: "Last test 11+ months ago" },
  { id: "due", label: "Balance pending", hint: "Have unpaid bills" },
  { id: "inactive", label: "Not visited in 6 months", hint: "Win them back" },
  { id: "recent", label: "Visited last 30 days", hint: "Thank you / review" },
  { id: "vip", label: "VIP customers", hint: "Marked as VIP" },
];

/** Mongo filter on Customer for a segment (some segments need a pre-query for ids). */
async function segmentFilter(id, ctx) {
  const now = new Date();
  switch (id) {
    case "birthday":
      return { $expr: { $eq: [{ $month: { date: "$dob", timezone: "Asia/Kolkata" } }, now.getMonth() + 1] }, dob: { $ne: null } };
    case "eyetest": {
      const rows = await Prescription.aggregate([
        { $group: { _id: "$customerId", last: { $max: "$visitDate" } } },
        { $match: { last: { $lt: subDays(now, 335) } } },
        { $project: { _id: 1 } },
      ]);
      return { _id: { $in: rows.map((r) => r._id) } };
    }
    case "due": {
      const ids = await Invoice.distinct("customerId", { status: "confirmed", balance: { $gt: 0 }, storeId: { $in: ctx.allowedStoreIds } });
      return { _id: { $in: ids } };
    }
    case "inactive":
      return { lastVisitAt: { $lt: subDays(now, 180) } };
    case "recent":
      return { lastVisitAt: { $gte: subDays(now, 30) } };
    case "vip":
      return { category: "VIP" };
    default:
      return {};
  }
}

export async function segmentCounts(ctx) {
  const counts = await Promise.all(SEGMENTS.map(async (s) => Customer.countDocuments(await segmentFilter(s.id, ctx))));
  return Object.fromEntries(SEGMENTS.map((s, i) => [s.id, counts[i]]));
}

export async function segmentContacts(id, ctx, limit = 5000) {
  const filter = await segmentFilter(id, ctx);
  return Customer.find(filter).sort({ lastVisitAt: -1 }).limit(limit).select("name mobile customerNo lastVisitAt").lean();
}
