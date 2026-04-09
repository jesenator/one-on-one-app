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
  // Cancel meetings, delete availability, then remove from retreat.
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
    <div className="min-h-screen bg-gray-50 p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Admin</h1>
        <Link href="/app/schedule" className="text-sm text-gray-600 underline">
          Back to app
        </Link>
      </div>

      {data.map(({ retreat, attendees, meetings }) => (
        <section key={retreat.id} className="mb-8">
          <h2 className="text-base font-semibold mb-2">{retreat.name}</h2>

          <h3 className="text-sm font-medium mt-3 mb-1">
            Attendees ({attendees.length})
          </h3>
          <ul className="bg-white border rounded-lg divide-y">
            {attendees.map((a) => (
              <li
                key={a.id}
                className="p-3 flex items-center justify-between text-sm"
              >
                <div>
                  <div className="font-medium">{a.user.name}</div>
                  <div className="text-xs text-gray-500">{a.user.email}</div>
                </div>
                <form action={removeUser}>
                  <input type="hidden" name="userId" value={a.userId} />
                  <input type="hidden" name="retreatId" value={retreat.id} />
                  <button className="text-xs text-red-600 underline">
                    Remove
                  </button>
                </form>
              </li>
            ))}
            {attendees.length === 0 && (
              <li className="p-3 text-xs text-gray-500">No attendees yet.</li>
            )}
          </ul>

          <h3 className="text-sm font-medium mt-4 mb-1">
            Meetings ({meetings.length})
          </h3>
          <ul className="bg-white border rounded-lg divide-y">
            {meetings.map((m) => (
              <li
                key={m.id}
                className="p-3 flex items-center justify-between text-sm"
              >
                <div>
                  <div className="font-medium">
                    {m.from.name} ↔ {m.to.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatSlotDay(m.slotStart)}{" "}
                    {formatSlotTime(m.slotStart)} · {m.status}
                  </div>
                </div>
                <form action={cancelMeeting}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="text-xs text-red-600 underline">
                    Cancel
                  </button>
                </form>
              </li>
            ))}
            {meetings.length === 0 && (
              <li className="p-3 text-xs text-gray-500">No meetings.</li>
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}
