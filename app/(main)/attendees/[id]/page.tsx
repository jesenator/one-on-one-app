import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getRetreat, generateSlots, groupSlotsByDay, nowInRetreatTz } from "@/lib/config";
import { getMyAvailability } from "@/lib/availability";
import OverlapGrid from "./OverlapGrid";

export default async function AttendeeProfile({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ slot?: string }>;
}) {
  const s = await getSession();
  if (!s.userId || !s.retreatId) redirect("/login");
  const { id } = await params;
  const { slot: preselectedSlot } = await searchParams;
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
      <a
        href="/attendees"
        className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-accent-600 transition mb-4 font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
        </svg>
        All attendees
      </a>
      <h1 className="text-2xl font-bold text-stone-900">{user.name}</h1>
      <p className="text-sm text-stone-400 mt-0.5 mb-6">
        Tap a green slot to request a 1:1
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
        highlightedSlots={retreat.highlightedSlots ?? []}
        now={nowInRetreatTz(retreat).toISOString()}
        preselectedSlot={preselectedSlot}
      />
    </div>
  );
}
