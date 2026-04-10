import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getRetreat, generateSlots, groupSlotsByDay } from "@/lib/config";
import { getMyAvailability } from "@/lib/availability";
import OverlapGrid from "./OverlapGrid";

export default async function AttendeeProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await getSession();
  if (!s.userId || !s.retreatId) redirect("/login");
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();
  const member = await prisma.retreatAttendance.findUnique({
    where: { userId_retreatId: { userId: id, retreatId: s.retreatId } },
  });
  if (!member) notFound();

  const retreat = getRetreat(s.retreatId)!;
  const slots = generateSlots(retreat);
  const groups = groupSlotsByDay(slots);

  const [mine, theirs, myAccepted, theirBooked, pending] = await Promise.all([
    getMyAvailability(s.userId, s.retreatId),
    getMyAvailability(id, s.retreatId),
    prisma.meetingRequest.findMany({
      where: {
        retreatId: s.retreatId,
        status: "accepted",
        OR: [{ fromUserId: s.userId }, { toUserId: s.userId }],
      },
      include: {
        from: { select: { id: true, name: true } },
        to: { select: { id: true, name: true } },
      },
    }),
    prisma.meetingRequest.findMany({
      where: {
        retreatId: s.retreatId,
        status: "accepted",
        OR: [{ fromUserId: id }, { toUserId: id }],
      },
      select: { slotStart: true },
    }),
    prisma.meetingRequest.findMany({
      where: {
        retreatId: s.retreatId,
        status: "pending",
        OR: [
          { fromUserId: s.userId, toUserId: id },
          { fromUserId: id, toUserId: s.userId },
        ],
      },
      select: { slotStart: true },
    }),
  ]);

  const myBookedMeetings: Record<string, string> = {};
  for (const m of myAccepted) {
    const other = m.fromUserId === s.userId ? m.to : m.from;
    myBookedMeetings[m.slotStart.toISOString()] = other.name || "someone";
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">{user.name}</h1>
      <p className="text-xs text-zinc-500 mb-3">{user.email}</p>
      <p className="text-xs text-zinc-500 mb-4">
        Tap a green slot to request a 1:1.
      </p>
      <OverlapGrid
        toUserId={id}
        toUserName={user.name || "them"}
        groups={Object.fromEntries(
          Object.entries(groups).map(([k, v]) => [
            k,
            v.map((d) => d.toISOString()),
          ]),
        )}
        mine={Array.from(mine)}
        theirs={Array.from(theirs)}
        myBookedMeetings={myBookedMeetings}
        theirBooked={theirBooked.map((p) => p.slotStart.toISOString())}
        pending={pending.map((p) => p.slotStart.toISOString())}
        now={new Date().toISOString()}
      />
    </div>
  );
}
