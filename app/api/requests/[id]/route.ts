import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notifyRequestAccepted, notifyRequestDeclined, notifyMeetingCancelled } from "@/lib/notifications";

const schema = z.object({
  action: z.enum(["accept", "decline", "cancel"]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s.userId)
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "bad input" }, { status: 400 });
  const mr = await prisma.meetingRequest.findUnique({ where: { id } });
  if (!mr) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (parsed.data.action === "accept" || parsed.data.action === "decline") {
    if (mr.toUserId !== s.userId)
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (mr.status !== "pending")
      return NextResponse.json({ error: "not pending" }, { status: 400 });
    if (parsed.data.action === "accept") {
      // Check conflict and update atomically to prevent double-booking
      try {
        await prisma.$transaction(async (tx) => {
          const conflict = await tx.meetingRequest.findFirst({
            where: {
              retreatId: mr.retreatId,
              slotStart: mr.slotStart,
              status: "accepted",
              OR: [
                { fromUserId: mr.fromUserId },
                { toUserId: mr.fromUserId },
                { fromUserId: mr.toUserId },
                { toUserId: mr.toUserId },
              ],
            },
          });
          if (conflict) throw new Error("Slot already booked.");
          await tx.meetingRequest.update({
            where: { id },
            data: { status: "accepted" },
          });
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to accept.";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    } else {
      await prisma.meetingRequest.update({
        where: { id },
        data: { status: "declined" },
      });
    }
    const [fromUser, toUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: mr.fromUserId }, select: { email: true, name: true } }),
      prisma.user.findUnique({ where: { id: mr.toUserId }, select: { name: true } }),
    ]);
    if (fromUser && toUser) {
      if (parsed.data.action === "accept") {
        notifyRequestAccepted(fromUser.email, toUser.name || "Someone", mr.slotStart);
      } else {
        notifyRequestDeclined(fromUser.email, toUser.name || "Someone", mr.slotStart);
      }
    }
  } else {
    // cancel: either party can cancel pending or accepted
    if (mr.fromUserId !== s.userId && mr.toUserId !== s.userId)
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    await prisma.meetingRequest.update({
      where: { id },
      data: { status: "cancelled" },
    });
    const otherId = mr.fromUserId === s.userId ? mr.toUserId : mr.fromUserId;
    const [otherUser, canceller] = await Promise.all([
      prisma.user.findUnique({ where: { id: otherId }, select: { email: true } }),
      prisma.user.findUnique({ where: { id: s.userId }, select: { name: true } }),
    ]);
    if (otherUser && canceller) {
      notifyMeetingCancelled(otherUser.email, canceller.name || "Someone", mr.slotStart);
    }
  }
  return NextResponse.json({ ok: true });
}
