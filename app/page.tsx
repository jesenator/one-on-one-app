import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getActiveRetreats, getRetreat, nowInRetreatTz } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const s = await getSession();
  if (s.userId && s.retreatId) redirect("/schedule");

  // Logged in but no retreat in session (e.g. logged back in via a plain
  // magic link after logout). Restore most recent active attendance.
  if (s.userId && !s.retreatId) {
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
  }

  // Not logged in (or logged in with no attendance): show join links for any
  // active retreat whose end date is still in the future, in its own tz.
  // Parsed as "fake UTC" to match generateSlots / nowInRetreatTz convention.
  const upcoming = getActiveRetreats().filter((r) => {
    const endFakeUtc = new Date(r.slots.end + ":00Z").getTime();
    return endFakeUtc > nowInRetreatTz(r).getTime();
  });
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-stone-50 text-stone-900">
      <div className="w-full max-w-md bg-white rounded-lg border border-stone-200 shadow-sm p-10 text-center">
        <div className="w-12 h-12 mx-auto mb-5 rounded-md bg-accent-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-6 h-6">
            <path d="M5.25 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75V12ZM6 13.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V14a.75.75 0 0 0-.75-.75H6ZM7.25 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H8a.75.75 0 0 1-.75-.75V12ZM8 13.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V14a.75.75 0 0 0-.75-.75H8ZM9.25 10a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H10a.75.75 0 0 1-.75-.75V10ZM10 11.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V12a.75.75 0 0 0-.75-.75H10ZM9.25 14a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H10a.75.75 0 0 1-.75-.75V14ZM12 9.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V10a.75.75 0 0 0-.75-.75H12ZM11.25 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H12a.75.75 0 0 1-.75-.75V12ZM12 13.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V14a.75.75 0 0 0-.75-.75H12ZM13.25 10a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H14a.75.75 0 0 1-.75-.75V10ZM14 11.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V12a.75.75 0 0 0-.75-.75H14Z" />
            <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-stone-900">EA Retreat 1:1s</h1>
        <p className="text-sm text-stone-500 leading-relaxed">
          {upcoming.length > 0
            ? "Join your retreat to start scheduling 1:1s."
            : "Use the link shared by your retreat organizer to get started."}
        </p>
        {upcoming.length > 0 && (
          <div className="mt-6 space-y-2 text-left">
            {upcoming.map((r) => (
              <Link
                key={r.id}
                href={r.joinPath ?? `/${r.id}`}
                className="flex items-center justify-between gap-3 rounded-md border border-stone-200 bg-stone-50/60 px-4 py-3 text-sm font-medium text-stone-700 hover:border-accent-300 hover:bg-accent-50 hover:text-accent-700 transition"
              >
                <span>{r.name}</span>
                <span aria-hidden className="text-stone-400">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
