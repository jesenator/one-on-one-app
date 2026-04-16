import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const s = await getSession();
  if (!s.userId) redirect("/login");

  if (s.retreatId) redirect("/schedule");

  const attendance = await prisma.retreatAttendance.findFirst({
    where: { userId: s.userId, retreat: { active: true } },
    orderBy: { createdAt: "desc" },
  });
  if (attendance) {
    s.retreatId = attendance.retreatId;
    await s.save();
    redirect("/schedule");
  }

  redirect("/no-retreat");
}
