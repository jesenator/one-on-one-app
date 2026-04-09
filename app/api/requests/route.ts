import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  toUserId: z.string(),
  slotStart: z.string(),
});

export async function POST(req: Request) {
  const s = await getSession();
  if (!s.userId || !s.retreatId)
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "bad input" }, { status: 400 });
  const slotStart = new Date(parsed.data.slotStart);

  // Validate both users have availability and aren't already booked
  const [fromAvail, toAvail, conflict] = await Promise.all([
    prisma.availability.findUnique({
      where: {
        userId_retreatId_slotStart: {
          userId: s.userId,
          retreatId: s.retreatId,
          slotStart,
        },
      },
    }),
    prisma.availability.findUnique({
      where: {
        userId_retreatId_slotStart: {
          userId: parsed.data.toUserId,
          retreatId: s.retreatId,
          slotStart,
        },
      },
    }),
    prisma.meetingRequest.findFirst({
      where: {
        retreatId: s.retreatId,
        slotStart,
        status: "accepted",
        OR: [
          { fromUserId: s.userId },
          { toUserId: s.userId },
          { fromUserId: parsed.data.toUserId },
          { toUserId: parsed.data.toUserId },
        ],
      },
    }),
  ]);
  if (!fromAvail || !toAvail)
    return NextResponse.json(
      { error: "Both users must mark this slot available." },
      { status: 400 },
    );
  if (conflict)
    return NextResponse.json(
      { error: "Slot already booked." },
      { status: 400 },
    );

  const created = await prisma.meetingRequest.create({
    data: {
      retreatId: s.retreatId,
      fromUserId: s.userId,
      toUserId: parsed.data.toUserId,
      slotStart,
      status: "pending",
    },
  });
  return NextResponse.json({ ok: true, id: created.id });
}
