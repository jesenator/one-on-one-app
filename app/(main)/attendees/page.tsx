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
    // Filter to attendees available at this specific slot
    const availableRecords = await prisma.availability.findMany({
      where: {
        retreatId: s.retreatId,
        slotStart: new Date(slot),
        userId: { not: s.userId },
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    others = availableRecords
      .map((a) => a.user)
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
      <h1 className="text-xl font-semibold mb-4">Attendees</h1>
      <AttendeeList attendees={others} slotFilter={slot} />
    </div>
  );
}
