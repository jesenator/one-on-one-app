import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notifyRequestAccepted, notifyRequestDeclined } from "@/lib/notifications";

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
      // ensure no conflict
      const conflict = await prisma.meetingRequest.findFirst({
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
      if (conflict)
        return NextResponse.json(
          { error: "Slot already booked." },
          { status: 400 },
        );
    }
    await prisma.meetingRequest.update({
      where: { id },
      data: {
        status: parsed.data.action === "accept" ? "accepted" : "declined",
      },
    });
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
  }
  return NextResponse.json({ ok: true });
}
