import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

const PROTECTED = ["/schedule", "/attendees", "/profile", "/requests"];
const NEEDS_USER_ONLY = ["/no-retreat", "/admin"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  const path = req.nextUrl.pathname;

  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(p + "/"));
  const isUserOnly = NEEDS_USER_ONLY.some((p) => path === p || path.startsWith(p + "/"));
  if (!isProtected && !isUserOnly) return res;

  if (!session.userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (isProtected && !session.retreatId) {
    return NextResponse.redirect(new URL("/no-retreat", req.url));
  }
  return res;
}

export const config = {
  matcher: [
    "/schedule/:path*",
    "/attendees/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/requests/:path*",
    "/no-retreat",
  ],
};
