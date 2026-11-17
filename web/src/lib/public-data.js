import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connectDB } from "./db";
import { Store } from "@/models";

/** Store list for the public website. Cached: it rarely changes and needs no login. */
export async function getPublicStores() {
  "use cache";
  cacheLife("hours");
  cacheTag("stores");
  await connectDB();
  const stores = await Store.find({ isActive: true }).sort({ code: 1 }).select("name code address city phone").lean();
  return stores.map((s) => ({ id: String(s._id), name: s.name, code: s.code, address: s.address, city: s.city, phone: s.phone }));
}
