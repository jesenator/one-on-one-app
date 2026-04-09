import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  getMyAvailability,
  getAcceptedMeetingSlots,
} from "@/lib/availability";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s.userId || !s.retreatId)
    return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { id } = await params;
  const member = await prisma.retreatAttendance.findUnique({
    where: { userId_retreatId: { userId: id, retreatId: s.retreatId } },
  });
  if (!member)
    return NextResponse.json({ error: "not in retreat" }, { status: 404 });
  const theirAvail = await getMyAvailability(id, s.retreatId);
  const theirBooked = await getAcceptedMeetingSlots(id, s.retreatId);
  const myAvail = await getMyAvailability(s.userId, s.retreatId);
  const myBooked = await getAcceptedMeetingSlots(s.userId, s.retreatId);
  // pending requests in either direction (block re-requests)
  const pending = await prisma.meetingRequest.findMany({
    where: {
      retreatId: s.retreatId,
      status: "pending",
      OR: [
        { fromUserId: s.userId, toUserId: id },
        { fromUserId: id, toUserId: s.userId },
      ],
    },
    select: { slotStart: true },
  });
  return NextResponse.json({
    their: Array.from(theirAvail),
    theirBooked: Array.from(theirBooked),
    mine: Array.from(myAvail),
    myBooked: Array.from(myBooked),
    pending: pending.map((p) => p.slotStart.toISOString()),
  });
}
