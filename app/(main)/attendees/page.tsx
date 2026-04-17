import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AttendeeList from "./AttendeeList";

export default async function AttendeesPage({
  searchParams,
}: {
  searchParams: Promise<{ slot?: string }>;
}) {
  const s = await getSession();
  if (!s.userId || !s.retreatId) redirect("/login");
  const { slot } = await searchParams;

  let others: { id: string; name: string; email: string }[];

  if (slot) {
    const [availableRecords, busy] = await Promise.all([
      prisma.availability.findMany({
        where: {
          retreatId: s.retreatId,
          slotStart: new Date(slot),
          userId: { not: s.userId },
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.meetingRequest.findMany({
        where: {
          retreatId: s.retreatId,
          slotStart: new Date(slot),
          status: { in: ["accepted", "pending"] },
        },
        select: { fromUserId: true, toUserId: true },
      }),
    ]);
    const busyIds = new Set(busy.flatMap((m) => [m.fromUserId, m.toUserId]));
    others = availableRecords
      .map((a) => a.user)
      .filter((u) => !busyIds.has(u.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  } else {
    const att = await prisma.retreatAttendance.findMany({
      where: { retreatId: s.retreatId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    others = att
      .map((a) => a.user)
      .filter((u) => u.id !== s.userId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Attendees</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          {others.length} {others.length === 1 ? "person" : "people"} at this retreat
        </p>
      </div>
      <AttendeeList attendees={others} slotFilter={slot} />
    </div>
  );
}
