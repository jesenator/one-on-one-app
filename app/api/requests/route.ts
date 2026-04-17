import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notifyNewRequest } from "@/lib/notifications";
import { getRetreat, nowInRetreatTz } from "@/lib/config";

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

  // Slots are stored as "fake UTC" — wall-clock time in the retreat's timezone
  // pretending to be UTC (see lib/config.ts generateSlots). Compare against
  // the same convention, not real UTC now, or west-coast users booking later
  // today get rejected because their local-hour < current UTC-hour.
  const retreat = await getRetreat(s.retreatId);
  if (!retreat)
    return NextResponse.json({ error: "retreat not found" }, { status: 400 });

  const BUFFER_MS = 30 * 60 * 1000;
  if (slotStart.getTime() < nowInRetreatTz(retreat).getTime() + BUFFER_MS) {
    return NextResponse.json(
      { error: "Can't book a slot less than 30 minutes from now." },
      { status: 400 },
    );
  }

  // Capture narrowed values for use inside transaction closure
  const userId = s.userId;
  const retreatId = s.retreatId;

  // Validate and create inside a transaction to prevent double-booking
  let created;
  try {
    created = await prisma.$transaction(async (tx) => {
      const [fromAvail, toAvail, conflict] = await Promise.all([
        tx.availability.findUnique({
          where: {
            userId_retreatId_slotStart: {
              userId,
              retreatId,
              slotStart,
            },
          },
        }),
        tx.availability.findUnique({
          where: {
            userId_retreatId_slotStart: {
              userId: parsed.data.toUserId,
              retreatId,
              slotStart,
            },
          },
        }),
        tx.meetingRequest.findFirst({
          where: {
            retreatId,
            slotStart,
            status: { in: ["accepted", "pending"] },
            OR: [
              { fromUserId: userId },
              { toUserId: userId },
              { fromUserId: parsed.data.toUserId },
              { toUserId: parsed.data.toUserId },
            ],
          },
        }),
      ]);
      if (!fromAvail || !toAvail) throw new Error("Both users must mark this slot available.");
      if (conflict) throw new Error("That time is no longer available.");

      return tx.meetingRequest.create({
        data: {
          retreatId,
          fromUserId: userId,
          toUserId: parsed.data.toUserId,
          slotStart,
          status: "pending",
        },
      });
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create request.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const [toUser, fromUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: parsed.data.toUserId }, select: { email: true } }),
    prisma.user.findUnique({ where: { id: s.userId }, select: { name: true } }),
  ]);

  if (toUser && fromUser) {
    notifyNewRequest(toUser.email, fromUser.name || "Someone", slotStart);
  }

  return NextResponse.json({ ok: true, id: created.id });
}
