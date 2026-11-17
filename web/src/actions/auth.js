"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { setSession, clearSession, getSession } from "@/lib/session";
import { getContext } from "@/lib/auth";
import { User } from "@/models";

const LoginSchema = z.object({
  username: z.string().trim().min(1, "Enter username"),
  password: z.string().min(1, "Enter password"),
});

export async function login(_prev, formData) {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await connectDB();
  const user = await User.findOne({ username: parsed.data.username.toLowerCase(), isActive: true }).lean();
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return { error: "Wrong username or password" };
  }

  await setSession({
    uid: String(user._id),
    activeStore: user.role === "owner" ? "all" : String(user.storeIds[0] ?? ""),
  });
  redirect("/dashboard");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}

export async function switchStore(storeId) {
  const ctx = await getContext();
  const session = await getSession();
  const allowed = storeId === "all" ? ctx.isOwner : ctx.stores.some((s) => s.id === storeId);
  if (!allowed) return { error: "Not allowed" };
  await setSession({ uid: session.uid, activeStore: storeId });
  refresh();
  return { ok: true };
}
