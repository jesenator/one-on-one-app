import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getRetreat, generateSlots, groupSlotsByDay } from "@/lib/config";
import {
  getMyAvailability,
  getAcceptedMeetingSlots,
} from "@/lib/availability";
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

  const [mine, theirs, myBooked, theirBooked, pending] = await Promise.all([
    getMyAvailability(s.userId, s.retreatId),
    getMyAvailability(id, s.retreatId),
    getAcceptedMeetingSlots(s.userId, s.retreatId),
    getAcceptedMeetingSlots(id, s.retreatId),
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

  return (
    <div>
      <h1 className="text-xl font-semibold">{user.name}</h1>
      <p className="text-xs text-zinc-500 mb-4">{user.email}</p>
      <p className="text-sm text-zinc-500 mb-4">
        Tap a slot where you&apos;re both available to request a 1:1.
      </p>
      <OverlapGrid
        toUserId={id}
        groups={Object.fromEntries(
          Object.entries(groups).map(([k, v]) => [
            k,
            v.map((d) => d.toISOString()),
          ]),
        )}
        mine={Array.from(mine)}
        theirs={Array.from(theirs)}
        myBooked={Array.from(myBooked)}
        theirBooked={Array.from(theirBooked)}
        pending={pending.map((p) => p.slotStart.toISOString())}
      />
    </div>
  );
}
