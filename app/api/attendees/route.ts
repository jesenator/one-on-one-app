import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const s = await getSession();
  if (!s.userId || !s.retreatId)
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  const att = await prisma.retreatAttendance.findMany({
    where: { retreatId: s.retreatId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json({
    attendees: att.map((a) => a.user).sort((a, b) => a.name.localeCompare(b.name)),
  });
}
