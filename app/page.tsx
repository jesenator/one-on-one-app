import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AutoSubmit from "./join/[retreatId]/AutoSubmit";

// Sessions can only be modified in a Server Action or Route Handler (see
// AGENTS.md), so the retreatId backfill goes through AutoSubmit like the
// join flow does.
async function resumeRetreat(retreatId: string) {
  "use server";
  const s = await getSession();
  if (!s.userId) redirect("/login");
  const attendance = await prisma.retreatAttendance.findUnique({
    where: { userId_retreatId: { userId: s.userId, retreatId } },
  });
  if (!attendance) redirect("/no-retreat");
  s.retreatId = retreatId;
  await s.save();
  redirect("/schedule");
}

export default async function Home() {
  const s = await getSession();
  if (!s.userId) redirect("/login");

  if (s.retreatId) redirect("/schedule");

  const attendance = await prisma.retreatAttendance.findFirst({
    where: { userId: s.userId, retreat: { active: true } },
    orderBy: { createdAt: "desc" },
  });
  if (attendance) {
    return <AutoSubmit action={resumeRetreat.bind(null, attendance.retreatId)} />;
  }

  redirect("/no-retreat");
}
