import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getRetreat, isAdminEmail } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import AppNav from "./AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  // Logged in but no retreat in session — restore from attendance so we don't
  // bounce the user back to /login after a plain magic-link re-login.
  if (!session.retreatId) {
    const attendances = await prisma.retreatAttendance.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });
    const recent = attendances.find((a) => getRetreat(a.retreatId)?.active);
    if (!recent) redirect("/login");
    session.retreatId = recent.retreatId;
    await session.save();
  }
  const retreat = getRetreat(session.retreatId);
  const admin = isAdminEmail(session.email || "");

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="h-0.5 bg-accent-500" />
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-6 py-3">
          <div className="flex items-center justify-between gap-2">
            <Link href="/schedule" className="flex min-w-0 flex-1 items-center gap-2.5 group">
              <div className="shrink-0 w-8 h-8 rounded-md bg-accent-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                  <path d="M5.25 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75V12ZM6 13.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V14a.75.75 0 0 0-.75-.75H6ZM7.25 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H8a.75.75 0 0 1-.75-.75V12ZM8 13.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V14a.75.75 0 0 0-.75-.75H8ZM9.25 10a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H10a.75.75 0 0 1-.75-.75V10ZM10 11.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V12a.75.75 0 0 0-.75-.75H10ZM9.25 14a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H10a.75.75 0 0 1-.75-.75V14ZM12 9.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V10a.75.75 0 0 0-.75-.75H12ZM11.25 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H12a.75.75 0 0 1-.75-.75V12ZM12 13.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V14a.75.75 0 0 0-.75-.75H12ZM13.25 10a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H14a.75.75 0 0 1-.75-.75V10ZM14 11.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V12a.75.75 0 0 0-.75-.75H14Z" />
                  <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-stone-900 group-hover:text-accent-500 transition truncate">1:1 Scheduler</div>
                <div className="text-[11px] text-stone-400 leading-none truncate">{retreat?.name}</div>
              </div>
            </Link>
            <div className="shrink-0">
              <AppNav admin={admin} />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8 animate-fade-in">{children}</main>
      <footer className="mt-auto py-4 text-center text-xs text-stone-400">
        Found a bug? Contact{" "}
        <a href="mailto:jessewgilbert@gmail.com" className="underline hover:text-stone-600">
          jessewgilbert@gmail.com
        </a>
      </footer>
    </div>
  );
}
