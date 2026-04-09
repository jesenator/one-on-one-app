import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function AttendeesPage() {
  const s = await getSession();
  if (!s.userId || !s.retreatId) redirect("/login");
  const att = await prisma.retreatAttendance.findMany({
    where: { retreatId: s.retreatId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  const others = att
    .map((a) => a.user)
    .filter((u) => u.id !== s.userId)
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold mb-3">Attendees</h1>
      <AttendeeList attendees={others} />
    </div>
  );
}

import AttendeeList from "./AttendeeList";
