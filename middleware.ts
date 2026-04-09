import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  const path = req.nextUrl.pathname;

  const isApp = path.startsWith("/app") || path.startsWith("/admin");
  if (isApp && !session.userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (isApp && !session.retreatId) {
    return NextResponse.redirect(new URL("/select-retreat", req.url));
  }
  return res;
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
