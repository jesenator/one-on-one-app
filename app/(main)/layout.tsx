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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              {retreat?.name}
            </div>
            <div className="text-lg font-semibold">1:1 Scheduler</div>
          </div>
          <AppNav admin={admin} />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
