import { NextResponse } from "next/server";
import { consumeMagicLink } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { getRetreat } from "@/lib/config";
import { prisma } from "@/lib/prisma";

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

  const retreatId = url.searchParams.get("retreat");
  if (retreatId && getRetreat(retreatId)?.active) {
    await prisma.retreatAttendance.upsert({
      where: { userId_retreatId: { userId: user.id, retreatId } },
      update: {},
      create: { userId: user.id, retreatId },
    });
    session.retreatId = retreatId;
    await session.save();
    return NextResponse.redirect(new URL("/app/schedule", url));
  }

  await session.save();
  return NextResponse.redirect(new URL("/", url));
}
