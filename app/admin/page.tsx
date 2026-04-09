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

export default async function AdminPage() {
  const s = await getSession();
  if (!s.userId) redirect("/login");
  if (!isAdminEmail(s.email || "")) redirect("/app/schedule");

  const retreats = getActiveRetreats();
  const data = await Promise.all(
    retreats.map(async (r) => ({
      retreat: r,
      attendees: await prisma.retreatAttendance.findMany({
        where: { retreatId: r.id },
        include: { user: true },
        orderBy: { user: { name: "asc" } },
      }),
      meetings: await prisma.meetingRequest.findMany({
        where: { retreatId: r.id, status: { in: ["pending", "accepted"] } },
        include: {
          from: { select: { name: true, email: true } },
          to: { select: { name: true, email: true } },
        },
        orderBy: { slotStart: "asc" },
      }),
    })),
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold">Admin</div>
          <Link
            href="/app/schedule"
            className="text-sm text-zinc-600 hover:text-zinc-900 transition"
          >
            Back to app
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-8">
        {data.map(({ retreat, attendees, meetings }) => (
          <section key={retreat.id} className="mb-10">
            <h2 className="text-base font-semibold mb-3">{retreat.name}</h2>

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
                    <input type="hidden" name="retreatId" value={retreat.id} />
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
          </section>
        ))}
      </div>
    </div>
  );
}
