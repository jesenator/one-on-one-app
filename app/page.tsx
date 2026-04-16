import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getRetreat } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const s = await getSession();
  if (!s.userId) redirect("/login");

  if (s.retreatId) redirect("/schedule");

  const attendances = await prisma.retreatAttendance.findMany({
    where: { userId: s.userId },
    orderBy: { createdAt: "desc" },
  });
  const recent = attendances.find((a) => getRetreat(a.retreatId)?.active);
  if (recent) {
    s.retreatId = recent.retreatId;
    await s.save();
    redirect("/schedule");
  }

  redirect("/no-retreat");
}
