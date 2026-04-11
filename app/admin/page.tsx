import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isAdminEmail, getActiveRetreats } from "@/lib/config";
import { formatSlotDay, formatSlotTime } from "@/lib/format";
import ConfirmButton from "./ConfirmButton";

async function removeUser(formData: FormData) {
  "use server";
  const s = await getSession();
  if (!s.email || !isAdminEmail(s.email)) redirect("/login");
  const userId = String(formData.get("userId"));
  const retreatId = String(formData.get("retreatId"));
  await prisma.meetingRequest.updateMany({
    where: {
      retreatId,
      OR: [{ fromUserId: userId }, { toUserId: userId }],
      status: { in: ["pending", "accepted"] },
    },
    data: { status: "cancelled" },
  });
  await prisma.availability.deleteMany({ where: { userId, retreatId } });
  await prisma.retreatAttendance.deleteMany({ where: { userId, retreatId } });
  redirect("/admin");
}

async function cancelMeeting(formData: FormData) {
  "use server";
  const s = await getSession();
  if (!s.email || !isAdminEmail(s.email)) redirect("/login");
  const id = String(formData.get("id"));
  await prisma.meetingRequest.update({
    where: { id },
    data: { status: "cancelled" },
  });
  redirect("/admin");
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ retreat?: string }>;
}) {
  const s = await getSession();
  if (!s.userId) redirect("/login");
  if (!isAdminEmail(s.email || "")) redirect("/schedule");

  const retreats = getActiveRetreats();
  const { retreat: activeTab } = await searchParams;
  const activeId = activeTab || retreats[0]?.id;
  const active = retreats.find((r) => r.id === activeId) ?? retreats[0];

  const [attendees, meetings, allRequests] = await Promise.all([
    prisma.retreatAttendance.findMany({
      where: { retreatId: active.id },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.meetingRequest.findMany({
      where: { retreatId: active.id, status: { in: ["pending", "accepted"] } },
      include: {
        from: { select: { id: true, name: true, email: true } },
        to: { select: { id: true, name: true, email: true } },
      },
      orderBy: { slotStart: "asc" },
    }),
    prisma.meetingRequest.findMany({
      where: { retreatId: active.id },
      select: { status: true, fromUserId: true, toUserId: true, from: { select: { name: true } }, to: { select: { name: true } } },
    }),
  ]);

  const confirmed = allRequests.filter((r) => r.status === "accepted");
  const pending = allRequests.filter((r) => r.status === "pending");
  const declined = allRequests.filter((r) => r.status === "declined");
  const cancelled = allRequests.filter((r) => r.status === "cancelled");

  const meetingCounts: Record<string, { name: string; count: number }> = {};
  for (const r of confirmed) {
    for (const u of [
      { id: r.fromUserId, name: r.from.name },
      { id: r.toUserId, name: r.to.name },
    ]) {
      if (!meetingCounts[u.id]) meetingCounts[u.id] = { name: u.name || "?", count: 0 };
      meetingCounts[u.id].count++;
    }
  }
  const leaderboard = Object.values(meetingCounts).sort((a, b) => b.count - a.count).slice(0, 10);
  const uniquePairs = new Set(confirmed.map((r) => [r.fromUserId, r.toUserId].sort().join("-"))).size;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="h-0.5 bg-accent-500" />
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-accent-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-semibold">Admin Dashboard</span>
          </div>
          <Link
            href="/schedule"
            className="text-sm text-stone-500 hover:text-accent-600 transition font-medium inline-flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
            Back to app
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 animate-fade-in">
        <div className="flex gap-1.5 pt-5 pb-1">
          {retreats.map((r) => (
            <Link
              key={r.id}
              href={`/admin?retreat=${r.id}`}
              className={[
                "px-4 py-2 text-sm font-semibold rounded-md transition",
                r.id === active.id
                  ? "bg-accent-50 text-accent-600"
                  : "text-stone-500 hover:text-stone-700 hover:bg-stone-100",
              ].join(" ")}
            >
              {r.name}
            </Link>
          ))}
        </div>

        <div className="py-8 space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Attendees" value={attendees.length} color="accent" />
            <Stat label="Confirmed" value={confirmed.length} color="emerald" />
            <Stat label="Unique pairs" value={uniquePairs} color="accent" />
            <Stat label="Pending" value={pending.length} color="amber" />
          </div>

          {leaderboard.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-stone-700 mb-3">Most 1:1s</h3>
              <div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm divide-y divide-stone-100">
                {leaderboard.map((l, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-stone-300 w-5">{i + 1}</span>
                      <span className="font-medium">{l.name}</span>
                    </div>
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full px-2.5 py-0.5">{l.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
          <h3 className="text-sm font-bold text-stone-700 mb-3">
            Attendees ({attendees.length})
          </h3>
          <div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm divide-y divide-stone-100">
            {attendees.map((a) => (
              <div
                key={a.id}
                className="p-4 flex items-center justify-between text-sm"
              >
                <div>
                  <div className="font-semibold">{a.user.name}</div>
                  <div className="text-xs text-stone-400">{a.user.email}</div>
                </div>
                <form action={removeUser}>
                  <input type="hidden" name="userId" value={a.userId} />
                  <input type="hidden" name="retreatId" value={active.id} />
                  <ConfirmButton
                    message={`Remove ${a.user.name}? This will cancel all their meetings.`}
                    label="Remove"
                    className="text-xs text-red-500 font-medium border border-red-200 rounded-md px-2.5 py-1 hover:bg-red-50 transition"
                  />
                </form>
              </div>
            ))}
            {attendees.length === 0 && (
              <div className="p-4 text-xs text-stone-400">No attendees yet.</div>
            )}
          </div>

          <h3 className="text-sm font-bold text-stone-700 mt-6 mb-3">
            Meetings ({meetings.length})
          </h3>
          <div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm divide-y divide-stone-100">
            {meetings.map((m) => (
              <div
                key={m.id}
                className="p-4 flex items-center justify-between text-sm"
              >
                <div>
                  <div className="font-semibold">
                    {m.from.name} &harr; {m.to.name}
                  </div>
                  <div className="text-xs text-stone-400">
                    {formatSlotDay(m.slotStart)}{" "}
                    {formatSlotTime(m.slotStart)} &middot;{" "}
                    <span className={m.status === "accepted" ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                      {m.status}
                    </span>
                  </div>
                </div>
                <form action={cancelMeeting}>
                  <input type="hidden" name="id" value={m.id} />
                  <ConfirmButton
                    message={`Cancel meeting between ${m.from.name} and ${m.to.name}?`}
                    label="Cancel"
                    className="text-xs text-red-500 font-medium border border-red-200 rounded-md px-2.5 py-1 hover:bg-red-50 transition"
                  />
                </form>
              </div>
            ))}
            {meetings.length === 0 && (
              <div className="p-4 text-xs text-stone-400">No meetings.</div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color = "stone" }: { label: string; value: number; color?: string }) {
  const colors: Record<string, string> = {
    accent: "bg-accent-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    stone: "bg-stone-500",
  };
  return (
    <div className="rounded-md border border-stone-200 bg-white shadow-sm p-4 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${colors[color] || colors.stone}`} />
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="text-xs text-stone-400 font-medium">{label}</div>
    </div>
  );
}
