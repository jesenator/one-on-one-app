import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getRetreat, isSuperAdmin, isRetreatAdmin } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import AppNav from "./AppNav";
import BrandMark from "../BrandMark";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (!session.retreatId) redirect("/no-retreat");
  const retreat = await getRetreat(session.retreatId);
  const admin = await isSuperAdmin(session.userId) || await isRetreatAdmin(session.userId, session.retreatId);
  const attendances = await prisma.retreatAttendance.findMany({
    where: { userId: session.userId, retreat: { active: true } },
    orderBy: { createdAt: "desc" },
    include: { retreat: true },
  });
  const retreats = attendances.map((a) => ({
    retreatId: a.retreatId,
    name: a.retreat.name,
    isCurrent: a.retreatId === session.retreatId,
  }));

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="h-0.5 bg-accent-500" />
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-6 py-3">
          <div className="flex items-center justify-between gap-2">
            <Link href="/schedule" className="flex min-w-0 flex-1 items-center gap-2.5 group">
              <BrandMark size="sm" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-stone-900 group-hover:text-accent-500 truncate">Pairwise</div>
                <div className="text-[11px] text-stone-400 leading-none truncate">{retreat?.name}</div>
              </div>
            </Link>
            <div className="shrink-0">
              <AppNav
                admin={admin}
                adminHref={`/admin/${session.retreatId}`}
                name={session.name}
                email={session.email}
                retreats={retreats}
              />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
