import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AttendeeList from "./AttendeeList";

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
    <div>
      <h1 className="text-xl font-semibold mb-4">Attendees</h1>
      <AttendeeList attendees={others} />
    </div>
  );
}
