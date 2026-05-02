import { prisma } from "./prisma";
import { lockSlot } from "./booking";
import {
  notifyRequestAccepted,
  notifyRequestDeclined,
  notifyMeetingCancelled,
} from "./notifications";

export type RespondAction = "accept" | "decline" | "cancel";

export type RespondResult =
  | { ok: true; otherName: string; slotStart: Date }
  | { ok: false; status: number; error: string };

export async function respondToRequest(
  requestId: string,
  userId: string,
  action: RespondAction,
): Promise<RespondResult> {
  const mr = await prisma.meetingRequest.findUnique({ where: { id: requestId } });
  if (!mr) return { ok: false, status: 404, error: "not found" };

  if (action === "accept" || action === "decline") {
    if (mr.toUserId !== userId)
      return { ok: false, status: 403, error: "forbidden" };
    if (mr.status !== "pending")
      return { ok: false, status: 400, error: "not pending" };

    if (action === "accept") {
      try {
        await prisma.$transaction(async (tx) => {
          await lockSlot(tx, mr.retreatId, mr.slotStart, [mr.fromUserId, mr.toUserId]);
          const [retreat, conflict] = await Promise.all([
            tx.retreat.findUnique({
              where: { id: mr.retreatId },
              select: { blockedSlots: true },
            }),
            tx.meetingRequest.findFirst({
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
            }),
          ]);
          if (retreat?.blockedSlots.includes(mr.slotStart.toISOString()))
            throw new Error("That slot has been blocked by the retreat admin.");
          if (conflict) throw new Error("Slot already booked.");
          await tx.meetingRequest.update({
            where: { id: requestId },
            data: { status: "accepted" },
          });
          await tx.meetingRequest.updateMany({
            where: {
              retreatId: mr.retreatId,
              slotStart: mr.slotStart,
              status: "pending",
              id: { not: requestId },
              OR: [
                { fromUserId: mr.fromUserId },
                { toUserId: mr.fromUserId },
                { fromUserId: mr.toUserId },
                { toUserId: mr.toUserId },
              ],
            },
            data: { status: "cancelled" },
          });
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to accept.";
        return { ok: false, status: 400, error: msg };
      }
    } else {
      await prisma.meetingRequest.update({
        where: { id: requestId },
        data: { status: "declined" },
      });
    }

    const [fromUser, toUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: mr.fromUserId }, select: { email: true, name: true } }),
      prisma.user.findUnique({ where: { id: mr.toUserId }, select: { name: true } }),
    ]);
    if (fromUser && toUser) {
      if (action === "accept") {
        notifyRequestAccepted(fromUser.email, toUser.name || "Someone", mr.slotStart);
      } else {
        notifyRequestDeclined(fromUser.email, toUser.name || "Someone", mr.slotStart);
      }
    }
    return { ok: true, otherName: fromUser?.name || "someone", slotStart: mr.slotStart };
  }

  // cancel: either party can cancel pending or accepted
  if (mr.fromUserId !== userId && mr.toUserId !== userId)
    return { ok: false, status: 403, error: "forbidden" };
  await prisma.meetingRequest.update({
    where: { id: requestId },
    data: { status: "cancelled" },
  });
  const otherId = mr.fromUserId === userId ? mr.toUserId : mr.fromUserId;
  const [otherUser, canceller] = await Promise.all([
    prisma.user.findUnique({ where: { id: otherId }, select: { email: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);
  if (otherUser && canceller) {
    notifyMeetingCancelled(otherUser.email, canceller.name || "Someone", mr.slotStart);
  }
  return { ok: true, otherName: canceller?.name || "someone", slotStart: mr.slotStart };
}
