import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import { connectDB } from "./db";
import { getSession } from "./session";
import { User, Store } from "@/models";

/**
 * Data Access Layer: resolves the logged-in user + the store they are working in.
 * Every page/action goes through this, so store filtering is always decided on the server.
 *
 * activeStoreId === null means "All stores" (owner only).
 */
export const getContext = cache(async () => {
  const session = await getSession();
  if (!session?.uid) redirect("/login");

  await connectDB();
  const user = mongoose.isValidObjectId(session.uid) ? await User.findById(session.uid).lean() : null;
  // Valid cookie but the user is gone/disabled: clear the cookie first, otherwise
  // proxy.js sends /login back to /dashboard and the browser loops.
  if (!user || !user.isActive) redirect("/api/logout");

  const isOwner = user.role === "owner";
  const storeFilter = isOwner ? { isActive: true } : { _id: { $in: user.storeIds }, isActive: true };
  const stores = await Store.find(storeFilter).sort({ code: 1 }).lean();
  const allowedIds = stores.map((s) => String(s._id));

  let activeStoreId = session.activeStore;
  if (activeStoreId === "all" && !isOwner) activeStoreId = null;
  if (activeStoreId !== "all" && !allowedIds.includes(activeStoreId)) activeStoreId = allowedIds[0] ?? null;
  if (activeStoreId === "all") activeStoreId = null;

  const activeStore = stores.find((s) => String(s._id) === activeStoreId) ?? null;

  return {
    user: { id: String(user._id), name: user.name, username: user.username, role: user.role },
    isOwner,
    canManage: user.role === "owner" || user.role === "manager",
    stores: stores.map((s) => ({ id: String(s._id), name: s.name, code: s.code, city: s.city })),
    allowedStoreIds: allowedIds.map((id) => new mongoose.Types.ObjectId(id)),
    activeStoreId,
    activeStore: activeStore
      ? { ...activeStore, _id: String(activeStore._id), id: String(activeStore._id) }
      : null,
  };
});

/** Mongo filter for store-scoped collections (invoices, inventory, prescriptions). */
export function storeScope(ctx, field = "storeId") {
  if (ctx.activeStoreId) return { [field]: new mongoose.Types.ObjectId(ctx.activeStoreId) };
  return { [field]: { $in: ctx.allowedStoreIds } };
}

/** For write operations that must happen in a specific store. */
export function requireActiveStore(ctx) {
  if (!ctx.activeStoreId) {
    throw new Error("Select a store from the top bar first (you are viewing All Stores).");
  }
  return new mongoose.Types.ObjectId(ctx.activeStoreId);
}

export function assertCanManage(ctx) {
  if (!ctx.canManage) throw new Error("You don't have permission to do this.");
}
