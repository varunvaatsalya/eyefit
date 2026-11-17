import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "eyefit_session";

// Optimistic auth check only. Real authorization happens in the Data Access Layer (lib/auth.js).
export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.SESSION_SECRET));
      valid = true;
    } catch {}
  }

  const isLogin = pathname === "/login";
  if (!valid && !isLogin) return NextResponse.redirect(new URL("/login", request.url));
  if (valid && isLogin) return NextResponse.redirect(new URL("/dashboard", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
