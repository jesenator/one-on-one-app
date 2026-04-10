import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getRetreat, isAdminEmail } from "@/lib/config";
import AppNav from "./AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.userId || !session.retreatId) redirect("/login");
  const retreat = getRetreat(session.retreatId);
  const admin = isAdminEmail(session.email || "");

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wide text-zinc-500">
                {retreat?.name}
              </span>
              <span className="text-xs uppercase tracking-wide text-zinc-500 sm:hidden"> &middot; </span>
              <span className="text-lg font-semibold sm:block hidden">1:1 Scheduler</span>
              <span className="text-sm font-semibold sm:hidden">1:1 Scheduler</span>
            </div>
            <div className="hidden sm:block">
              <AppNav admin={admin} />
            </div>
          </div>
          <div className="mt-3 sm:hidden">
            <AppNav admin={admin} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
