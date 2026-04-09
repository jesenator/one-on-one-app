import { NextResponse } from "next/server";
import { consumeMagicLink } from "@/lib/auth";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing", url));
  }
  const user = await consumeMagicLink(token);
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=invalid", url));
  }
  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;
  await session.save();
  return NextResponse.redirect(new URL("/select-retreat", url));
}
