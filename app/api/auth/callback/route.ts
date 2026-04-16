import { NextResponse } from "next/server";
import { consumeMagicLink } from "@/lib/auth";
import { getSession } from "@/lib/session";
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
  if (retreatId) {
    const retreat = await prisma.retreat.findUnique({ where: { id: retreatId } });
    if (retreat?.active) {
      await prisma.retreatAttendance.upsert({
        where: { userId_retreatId: { userId: user.id, retreatId } },
        update: {},
        create: { userId: user.id, retreatId },
      });
      session.retreatId = retreatId;
      await session.save();
      return NextResponse.redirect(new URL("/schedule", url));
    }
  }

  const recent = await prisma.retreatAttendance.findFirst({
    where: { userId: user.id, retreat: { active: true } },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    session.retreatId = recent.retreatId;
    await session.save();
    return NextResponse.redirect(new URL("/schedule", url));
  }

  await session.save();
  return NextResponse.redirect(new URL("/no-retreat", url));
}
