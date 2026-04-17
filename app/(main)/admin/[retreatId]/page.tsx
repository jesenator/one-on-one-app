import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isRetreatAdmin, isSuperAdmin, isValidTimezone, nowInRetreatTz, generateSlots, groupSlotsByDay } from "@/lib/config";
import SlotChipPicker from "./SlotChipPicker";
import CopyJoinLink from "./CopyJoinLink";
import SettingsSaveButton from "./SettingsSaveButton";
import TimezoneSelect from "../TimezoneSelect";
import { formatSlotDay, formatSlotTime } from "@/lib/format";
import { notifyPendingReminder } from "@/lib/notifications";
import ConfirmButton from "../ConfirmButton";
import SendRemindersButton from "../SendRemindersButton";

async function requireAdmin(retreatId: string) {
  const s = await getSession();
  if (!s.userId) redirect("/login");
  if (!(await isRetreatAdmin(s.userId, retreatId))) redirect("/schedule");
  return s;
}

async function updateSettings(formData: FormData) {
  "use server";
  const retreatId = String(formData.get("retreatId"));
  await requireAdmin(retreatId);
  const timezone = String(formData.get("timezone") || "").trim();
  if (!isValidTimezone(timezone)) redirect(`/admin/${retreatId}`);
  await prisma.retreat.update({
    where: { id: retreatId },
    data: {
      name: String(formData.get("name") || "").trim(),
      timezone,
      slotsStart: String(formData.get("slotsStart") || "").trim(),
      slotsEnd: String(formData.get("slotsEnd") || "").trim(),
      dayStart: String(formData.get("dayStart") || "08:00").trim(),
      dayEnd: String(formData.get("dayEnd") || "22:00").trim(),
      granularityMinutes: Number(formData.get("granularityMinutes")) || 30,
      highlightedSlots: String(formData.get("highlightedSlots") || "").split("\n").map((s) => s.trim()).filter(Boolean),
      active: formData.get("active") === "on",
    },
  });
  redirect(`/admin/${retreatId}`);
}

async function addRetreatAdmin(formData: FormData) {
  "use server";
  const retreatId = String(formData.get("retreatId"));
  await requireAdmin(retreatId);
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect(`/admin/${retreatId}`);
  await prisma.retreatAdmin.upsert({
    where: { userId_retreatId: { userId: user.id, retreatId } },
    update: {},
    create: { userId: user.id, retreatId },
  });
  redirect(`/admin/${retreatId}`);
}

async function removeRetreatAdmin(formData: FormData) {
  "use server";
  const retreatId = String(formData.get("retreatId"));
  await requireAdmin(retreatId);
  const id = String(formData.get("id"));
  await prisma.retreatAdmin.delete({ where: { id } });
  redirect(`/admin/${retreatId}`);
}

async function removeUser(formData: FormData) {
  "use server";
  const retreatId = String(formData.get("retreatId"));
  await requireAdmin(retreatId);
  const userId = String(formData.get("userId"));
  await prisma.meetingRequest.updateMany({
    where: { retreatId, OR: [{ fromUserId: userId }, { toUserId: userId }], status: { in: ["pending", "accepted"] } },
    data: { status: "cancelled" },
  });
  await prisma.availability.deleteMany({ where: { userId, retreatId } });
  await prisma.retreatAttendance.deleteMany({ where: { userId, retreatId } });
  redirect(`/admin/${retreatId}`);
}

async function cancelMeeting(formData: FormData) {
  "use server";
  const retreatId = String(formData.get("retreatId"));
  await requireAdmin(retreatId);
  const id = String(formData.get("id"));
  await prisma.meetingRequest.update({ where: { id }, data: { status: "cancelled" } });
  redirect(`/admin/${retreatId}`);
}

async function sendPendingReminders(_prev: string | null, formData: FormData): Promise<string> {
  "use server";
  const retreatId = String(formData.get("retreatId"));
  const retreatName = String(formData.get("retreatName"));
  await requireAdmin(retreatId);
  const retreat = await prisma.retreat.findUnique({ where: { id: retreatId } });
  if (!retreat) return "Retreat not found.";

  const pendingRequests = await prisma.meetingRequest.findMany({
    where: { retreatId, status: "pending", slotStart: { gte: nowInRetreatTz(retreat) } },
    select: { toUserId: true, to: { select: { name: true, email: true } } },
  });

  const byUser: Record<string, { name: string; email: string; count: number }> = {};
  for (const r of pendingRequests) {
    if (!byUser[r.toUserId]) byUser[r.toUserId] = { name: r.to.name || "there", email: r.to.email, count: 0 };
    byUser[r.toUserId].count++;
  }
  const users = Object.values(byUser);
  await Promise.all(users.map((u) => notifyPendingReminder(u.email, u.name, u.count, retreatName)));
  return `Sent reminders to ${users.length} ${users.length === 1 ? "person" : "people"}.`;
}

export default async function RetreatAdminPage({ params }: { params: Promise<{ retreatId: string }> }) {
  const { retreatId } = await params;
  const s = await getSession();
  if (!s.userId) redirect("/login");
  if (!(await isRetreatAdmin(s.userId, retreatId))) redirect("/schedule");
  const superAdmin = await isSuperAdmin(s.userId);
  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  const joinUrl = `${proto}://${host}/join/${retreatId}`;

  const retreat = await prisma.retreat.findUnique({ where: { id: retreatId } });
  if (!retreat) notFound();

  const allSlots = generateSlots(retreat);
  const totalSlotCount = allSlots.length;
  const slotGroupsIso = Object.fromEntries(
    Object.entries(groupSlotsByDay(allSlots)).map(([k, v]) => [k, v.map((d) => d.toISOString())])
  );

  const [attendees, meetings, allRequests, admins, availabilityCounts] = await Promise.all([
    prisma.retreatAttendance.findMany({
      where: { retreatId },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.meetingRequest.findMany({
      where: { retreatId, status: { in: ["pending", "accepted"] } },
      include: {
        from: { select: { id: true, name: true, email: true } },
        to: { select: { id: true, name: true, email: true } },
      },
      orderBy: { slotStart: "asc" },
    }),
    prisma.meetingRequest.findMany({
      where: { retreatId },
      select: { status: true, fromUserId: true, toUserId: true, from: { select: { name: true } }, to: { select: { name: true } } },
    }),
    prisma.retreatAdmin.findMany({
      where: { retreatId },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.availability.groupBy({
      by: ["userId"],
      where: { retreatId },
      _count: { _all: true },
    }),
  ]);

  const confirmed = allRequests.filter((r) => r.status === "accepted");
  const pending = allRequests.filter((r) => r.status === "pending");
  const declined = allRequests.filter((r) => r.status === "declined");
  const cancelled = allRequests.filter((r) => r.status === "cancelled");
  const uniquePairs = new Set(confirmed.map((r) => [r.fromUserId, r.toUserId].sort().join("-"))).size;

  const availabilityByUser: Record<string, number> = {};
  for (const c of availabilityCounts) availabilityByUser[c.userId] = c._count._all;

  type UserStats = { accepted: number; pendingOut: number; pendingIn: number; declined: number; availability: number };
  const statsByUser: Record<string, UserStats> = {};
  for (const a of attendees) {
    statsByUser[a.userId] = { accepted: 0, pendingOut: 0, pendingIn: 0, declined: 0, availability: availabilityByUser[a.userId] || 0 };
  }
  for (const r of allRequests) {
    if (r.status === "accepted") {
      if (statsByUser[r.fromUserId]) statsByUser[r.fromUserId].accepted++;
      if (statsByUser[r.toUserId]) statsByUser[r.toUserId].accepted++;
    } else if (r.status === "pending") {
      if (statsByUser[r.fromUserId]) statsByUser[r.fromUserId].pendingOut++;
      if (statsByUser[r.toUserId]) statsByUser[r.toUserId].pendingIn++;
    } else if (r.status === "declined") {
      if (statsByUser[r.fromUserId]) statsByUser[r.fromUserId].declined++;
    }
  }

  const leaderboard = attendees
    .map((a) => ({ name: a.user.name || "?", count: statsByUser[a.userId]?.accepted || 0 }))
    .filter((l) => l.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const customizedAvailability = attendees.filter((a) => {
    const n = availabilityByUser[a.userId] || 0;
    return n > 0 && n < totalSlotCount;
  }).length;
  const unmatched = attendees.filter((a) => (statsByUser[a.userId]?.accepted || 0) === 0).length;
  const avgPerAttendee = attendees.length > 0 ? ((confirmed.length * 2) / attendees.length).toFixed(1) : "0";

  const futurePending = await prisma.meetingRequest.findMany({
    where: { retreatId, status: "pending", slotStart: { gte: nowInRetreatTz(retreat) } },
    select: { toUserId: true, to: { select: { name: true, email: true } } },
  });
  const pendingByUser: Record<string, { name: string; email: string; count: number }> = {};
  for (const r of futurePending) {
    if (!pendingByUser[r.toUserId]) pendingByUser[r.toUserId] = { name: r.to.name || "?", email: r.to.email, count: 0 };
    pendingByUser[r.toUserId].count++;
  }
  const pendingUsersList = Object.values(pendingByUser).sort((a, b) => b.count - a.count);
  const sendRemindersForRetreat = sendPendingReminders.bind(null);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-stone-900">{retreat.name} Admin</h1>
          {superAdmin && (
            <Link href="/admin" className="text-xs font-semibold text-white bg-stone-800 rounded-md px-3 py-1.5 hover:bg-stone-900 transition">
              All retreats
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-stone-400">Join link:</span>
          <CopyJoinLink url={joinUrl} />
        </div>
      </div>

        {/* Settings */}
        <div>
          <h2 className="text-sm font-bold text-stone-700 mb-3">Settings</h2>
          <form action={updateSettings} className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm p-6 space-y-4">
            <input type="hidden" name="retreatId" value={retreatId} />
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800 leading-relaxed">
              <span className="font-semibold">Warning:</span> avoid changing settings after the retreat has begun. In particular, changing <span className="font-semibold">slots start</span> or <span className="font-semibold">slot minutes</span> will break existing availability and booked meetings.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Name</label>
                <input name="name" required defaultValue={retreat.name} className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Timezone</label>
                <TimezoneSelect
                  name="timezone"
                  required
                  defaultValue={retreat.timezone}
                  className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Slots start</label>
                <input name="slotsStart" type="datetime-local" required defaultValue={retreat.slotsStart} className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Slots end</label>
                <input name="slotsEnd" type="datetime-local" required defaultValue={retreat.slotsEnd} className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Day start</label>
                <input name="dayStart" type="time" defaultValue={retreat.dayStart} className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Day end</label>
                <input name="dayEnd" type="time" defaultValue={retreat.dayEnd} className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Slot minutes</label>
                <input name="granularityMinutes" type="number" defaultValue={retreat.granularityMinutes} min={5} className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
              </div>
            </div>
            <details className="group">
              <summary className="text-xs font-semibold text-stone-600 cursor-pointer select-none flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-stone-400 transition-transform group-open:rotate-90">
                  <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
                Highlighted slots ({retreat.highlightedSlots.length})
              </summary>
              <div className="mt-2">
                <SlotChipPicker groups={slotGroupsIso} initial={retreat.highlightedSlots} />
              </div>
            </details>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={retreat.active} className="rounded border-stone-300" />
              <span className="font-medium text-stone-700">Active</span>
            </label>
            <SettingsSaveButton
              initial={{
                slotsStart: retreat.slotsStart,
                slotsEnd: retreat.slotsEnd,
                dayStart: retreat.dayStart,
                dayEnd: retreat.dayEnd,
                granularityMinutes: retreat.granularityMinutes,
                timezone: retreat.timezone,
              }}
            />
          </form>
        </div>

        {/* Retreat admins */}
        <div>
          <h2 className="text-sm font-bold text-stone-700 mb-3">Retreat admins</h2>
          <div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm divide-y divide-stone-100">
            {admins.map((a) => (
              <div key={a.id} className="p-4 flex items-center justify-between text-sm">
                <div>
                  <div className="font-semibold">{a.user.name}</div>
                  <div className="text-xs text-stone-400">{a.user.email}</div>
                </div>
                <form action={removeRetreatAdmin}>
                  <input type="hidden" name="retreatId" value={retreatId} />
                  <input type="hidden" name="id" value={a.id} />
                  <ConfirmButton message={`Remove ${a.user.name} as retreat admin?`} label="Remove" className="text-xs text-red-500 font-medium border border-red-200 rounded-md px-2.5 py-1 hover:bg-red-50" />
                </form>
              </div>
            ))}
            {admins.length === 0 && <div className="p-4 text-xs text-stone-400">No retreat admins. Super admins always have access.</div>}
          </div>
          <form action={addRetreatAdmin} className="mt-3 flex gap-2">
            <input type="hidden" name="retreatId" value={retreatId} />
            <input name="email" type="email" required placeholder="Email address" className="flex-1 border border-stone-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
            <button className="bg-accent-500 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-accent-600">Add</button>
          </form>
        </div>

        {/* Stats */}
        <div className="rounded-md border border-stone-200 bg-stone-200 shadow-sm overflow-hidden p-px">
          <div className="grid grid-cols-3 sm:grid-cols-9 gap-px">
            <MiniStat label="Attendees" value={attendees.length} />
            <MiniStat
              label="Edited availability"
              value={customizedAvailability}
              title="Attendees who turned off at least one slot. New visitors get every slot available by default until they change it."
            />
            <MiniStat
              label="No meeting yet"
              value={unmatched}
              accent={unmatched > 0 ? "amber" : undefined}
              title="Attendees with zero confirmed one-on-one meetings so far."
            />
            <MiniStat label="Avg per person" value={avgPerAttendee} title="Average number of confirmed meetings per attendee (each meeting counts for both people)." />
            <MiniStat label="Confirmed" value={confirmed.length} accent="emerald" />
            <MiniStat label="Unique pairs" value={uniquePairs} accent="emerald" title="Distinct pairs who have at least one confirmed meeting." />
            <MiniStat label="Pending" value={pending.length} accent="amber" />
            <MiniStat label="Declined" value={declined.length} accent="stone" title="Requests that were declined." />
            <MiniStat label="Cancelled" value={cancelled.length} accent="stone" title="Meetings or requests that were cancelled." />
          </div>
        </div>

        <SendRemindersButton action={sendRemindersForRetreat} pendingUsers={pendingUsersList} retreatId={retreat.id} retreatName={retreat.name} />

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

        {/* Attendees */}
        <div>
          <h3 className="text-sm font-bold text-stone-700 mb-3">Attendees ({attendees.length})</h3>
          <div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm divide-y divide-stone-100">
            {attendees.map((a) => {
              const st = statsByUser[a.userId] || { accepted: 0, pendingOut: 0, pendingIn: 0, declined: 0, availability: 0 };
              return (
                <div key={a.id} className="p-3 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{a.user.name}</div>
                    <div className="text-xs text-stone-400 truncate">{a.user.email}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <CountBadge title="Booked meetings" value={st.accepted} color="emerald" label="booked" />
                    <CountBadge title="Pending outgoing (you sent)" value={st.pendingOut} color="blue" label="sent" />
                    <CountBadge title="Pending incoming (awaiting their response)" value={st.pendingIn} color="amber" label="incoming" />
                    <CountBadge
                      title={`Slots open on their calendar (of ${totalSlotCount} total; default is all open).`}
                      value={st.availability}
                      color="stone"
                      label="open"
                    />
                    <form action={removeUser}>
                      <input type="hidden" name="userId" value={a.userId} />
                      <input type="hidden" name="retreatId" value={retreatId} />
                      <ConfirmButton message={`Remove ${a.user.name}? This will cancel all their meetings.`} label="Remove" className="text-xs text-red-500 font-medium border border-red-200 rounded-md px-2 py-1 hover:bg-red-50" />
                    </form>
                  </div>
                </div>
              );
            })}
            {attendees.length === 0 && <div className="p-4 text-xs text-stone-400">No attendees yet.</div>}
          </div>
        </div>

        {/* Meetings */}
        <div>
          <h3 className="text-sm font-bold text-stone-700 mb-3">Meetings ({meetings.length})</h3>
          <div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm divide-y divide-stone-100">
            {meetings.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between text-sm">
                <div>
                  <div className="font-semibold">{m.from.name} &harr; {m.to.name}</div>
                  <div className="text-xs text-stone-400">
                    {formatSlotDay(m.slotStart)} {formatSlotTime(m.slotStart)} &middot;{" "}
                    <span className={m.status === "accepted" ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>{m.status}</span>
                  </div>
                </div>
                <form action={cancelMeeting}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="retreatId" value={retreatId} />
                  <ConfirmButton message={`Cancel meeting between ${m.from.name} and ${m.to.name}?`} label="Cancel" className="text-xs text-red-500 font-medium border border-red-200 rounded-md px-2.5 py-1 hover:bg-red-50" />
                </form>
              </div>
            ))}
            {meetings.length === 0 && <div className="p-4 text-xs text-stone-400">No meetings.</div>}
          </div>
        </div>
    </div>
  );
}

function MiniStat({ label, value, accent, title }: { label: string; value: number | string; accent?: string; title?: string }) {
  const accents: Record<string, string> = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    accent: "text-accent-600",
    stone: "text-stone-500",
    red: "text-red-600",
    blue: "text-blue-600",
  };
  return (
    <div className="px-3 py-2 min-h-13 bg-white" title={title}>
      <div className={`text-lg font-bold leading-tight tabular-nums ${accent ? accents[accent] || "text-stone-900" : "text-stone-900"}`}>{value}</div>
      <div className="text-[10px] text-stone-500 font-semibold uppercase tracking-wide mt-0.5 leading-snug">{label}</div>
    </div>
  );
}

function CountBadge({ value, color, label, title }: { value: number; color: "emerald" | "blue" | "amber" | "stone"; label: string; title: string }) {
  const colors = {
    emerald: { on: "bg-emerald-100 text-emerald-700", off: "bg-stone-50 text-stone-300" },
    blue: { on: "bg-blue-100 text-blue-700", off: "bg-stone-50 text-stone-300" },
    amber: { on: "bg-amber-100 text-amber-700", off: "bg-stone-50 text-stone-300" },
    stone: { on: "bg-stone-100 text-stone-600", off: "bg-stone-50 text-stone-300" },
  };
  const cls = value > 0 ? colors[color].on : colors[color].off;
  return (
    <span title={title} className={`text-xs font-semibold rounded-full px-2 py-0.5 tabular-nums ${cls}`}>
      {value}
      <span className="hidden sm:inline ml-1 font-medium opacity-80">{label}</span>
    </span>
  );
}
