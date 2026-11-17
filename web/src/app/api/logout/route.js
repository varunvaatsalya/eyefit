import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

// Clears the session cookie and sends the user to /login.
// Used when the cookie is valid but its user no longer exists or is disabled
// (e.g. after re-seeding the DB). Server Components cannot delete cookies themselves.
export function GET(request) {
  const res = NextResponse.redirect(new URL("/login", request.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
