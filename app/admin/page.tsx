import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isAdminEmail, getActiveRetreats } from "@/lib/config";
import { formatSlotDay, formatSlotTime } from "@/lib/format";

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
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold">Admin</div>
          <Link
            href="/schedule"
            className="text-sm text-zinc-600 hover:text-zinc-900 transition"
          >
            Back to app
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6">
        <div className="flex gap-1 border-b border-zinc-200 pt-4">
          {retreats.map((r) => (
            <Link
              key={r.id}
              href={`/admin?retreat=${r.id}`}
              className={[
                "px-4 py-2 text-sm font-medium rounded-t-md -mb-px border transition",
                r.id === active.id
                  ? "border-zinc-200 border-b-white bg-white text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-700",
              ].join(" ")}
            >
              {r.name}
            </Link>
          ))}
        </div>

        <div className="py-8 space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Attendees" value={attendees.length} />
            <Stat label="Confirmed 1:1s" value={confirmed.length} />
            <Stat label="Unique pairs" value={uniquePairs} />
            <Stat label="Pending" value={pending.length} />
          </div>

          {leaderboard.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 mb-2">Most 1:1s</h3>
              <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
                {leaderboard.map((l, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center justify-between text-sm">
                    <span>{l.name}</span>
                    <span className="text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full px-2 py-0.5">{l.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
          <h3 className="text-sm font-semibold text-zinc-700 mb-2">
            Attendees ({attendees.length})
          </h3>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
            {attendees.map((a) => (
              <div
                key={a.id}
                className="p-4 flex items-center justify-between text-sm"
              >
                <div>
                  <div className="font-medium">{a.user.name}</div>
                  <div className="text-xs text-zinc-500">{a.user.email}</div>
                </div>
                <form action={removeUser}>
                  <input type="hidden" name="userId" value={a.userId} />
                  <input type="hidden" name="retreatId" value={active.id} />
                  <button className="text-xs text-red-600 border border-red-200 rounded-md px-2 py-1 hover:bg-red-50 transition">
                    Remove
                  </button>
                </form>
              </div>
            ))}
            {attendees.length === 0 && (
              <div className="p-4 text-xs text-zinc-500">No attendees yet.</div>
            )}
          </div>

          <h3 className="text-sm font-semibold text-zinc-700 mt-6 mb-2">
            Meetings ({meetings.length})
          </h3>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
            {meetings.map((m) => (
              <div
                key={m.id}
                className="p-4 flex items-center justify-between text-sm"
              >
                <div>
                  <div className="font-medium">
                    {m.from.name} &harr; {m.to.name}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {formatSlotDay(m.slotStart)}{" "}
                    {formatSlotTime(m.slotStart)} &middot; {m.status}
                  </div>
                </div>
                <form action={cancelMeeting}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="text-xs text-red-600 border border-red-200 rounded-md px-2 py-1 hover:bg-red-50 transition">
                    Cancel
                  </button>
                </form>
              </div>
            ))}
            {meetings.length === 0 && (
              <div className="p-4 text-xs text-zinc-500">No meetings.</div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}
