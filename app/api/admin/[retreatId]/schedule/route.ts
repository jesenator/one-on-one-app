import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isRetreatAdmin } from "@/lib/config";
import { lockSlot } from "@/lib/booking";
import { notifyAdminScheduled } from "@/lib/notifications";

const schema = z.object({
  fromUserId: z.string(),
  toUserId: z.string(),
  slotStart: z.string(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ retreatId: string }> },
) {
  const s = await getSession();
  if (!s.userId) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { retreatId } = await params;
  if (!(await isRetreatAdmin(s.userId, retreatId)))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "bad input" }, { status: 400 });
  const { fromUserId, toUserId } = parsed.data;
  if (fromUserId === toUserId)
    return NextResponse.json({ error: "Pick two different people." }, { status: 400 });

  const slotStart = new Date(parsed.data.slotStart);

  let created;
  try {
    created = await prisma.$transaction(async (tx) => {
      await lockSlot(tx, retreatId, slotStart, [fromUserId, toUserId]);
      const [fromAttendance, toAttendance, retreat, conflict] = await Promise.all([
        tx.retreatAttendance.findUnique({ where: { userId_retreatId: { userId: fromUserId, retreatId } } }),
        tx.retreatAttendance.findUnique({ where: { userId_retreatId: { userId: toUserId, retreatId } } }),
        tx.retreat.findUnique({ where: { id: retreatId }, select: { blockedSlots: true } }),
        tx.meetingRequest.findFirst({
          where: {
            retreatId,
            slotStart,
            status: "accepted",
            OR: [
              { fromUserId },
              { toUserId: fromUserId },
              { fromUserId: toUserId },
              { toUserId },
            ],
          },
        }),
      ]);
      if (!fromAttendance || !toAttendance) throw new Error("Both users must be retreat attendees.");
      if (retreat?.blockedSlots.includes(slotStart.toISOString()))
        throw new Error("That slot is blocked.");
      if (conflict) throw new Error("One or both already have a meeting at that time.");

      const meeting = await tx.meetingRequest.create({
        data: {
          retreatId,
          fromUserId,
          toUserId,
          slotStart,
          status: "accepted",
        },
      });
      // Cancel any pending requests at this slot for either party
      await tx.meetingRequest.updateMany({
        where: {
          retreatId,
          slotStart,
          status: "pending",
          id: { not: meeting.id },
          OR: [
            { fromUserId },
            { toUserId: fromUserId },
            { fromUserId: toUserId },
            { toUserId },
          ],
        },
        data: { status: "cancelled" },
      });
      return meeting;
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to schedule.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const [admin, fromUser, toUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: s.userId }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: fromUserId }, select: { name: true, email: true } }),
    prisma.user.findUnique({ where: { id: toUserId }, select: { name: true, email: true } }),
  ]);
  if (admin && fromUser && toUser) {
    notifyAdminScheduled(fromUser.email, admin.name || "Admin", toUser.name || "someone", slotStart);
    notifyAdminScheduled(toUser.email, admin.name || "Admin", fromUser.name || "someone", slotStart);
  }

  return NextResponse.json({ ok: true, id: created.id });
}
