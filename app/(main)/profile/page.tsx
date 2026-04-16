import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin, isRetreatAdmin } from "@/lib/config";
import DeleteButton from "./DeleteButton";

async function deleteAccount() {
  "use server";
  const session = await getSession();
  if (!session.userId) redirect("/login");
  await prisma.meetingRequest.updateMany({
    where: {
      OR: [{ fromUserId: session.userId }, { toUserId: session.userId }],
      status: { in: ["pending", "accepted"] },
    },
    data: { status: "cancelled" },
  });
  await prisma.user.delete({ where: { id: session.userId } });
  session.destroy();
  redirect("/login");
}

async function switchRetreat(retreatId: string) {
  "use server";
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const attendance = await prisma.retreatAttendance.findUnique({
    where: { userId_retreatId: { userId: session.userId, retreatId } },
  });
  if (!attendance) redirect("/profile");
  session.retreatId = retreatId;
  await session.save();
  redirect("/schedule");
}

async function updateName(formData: FormData) {
  "use server";
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const name = String(formData.get("name") || "").trim();
  if (name) {
    await prisma.user.update({ where: { id: session.userId }, data: { name } });
    session.name = name;
    await session.save();
  }
  redirect("/profile");
}

export default async function ProfilePage() {
  const s = await getSession();
  if (!s.userId) redirect("/login");
  const admin = await isSuperAdmin(s.userId) || await isRetreatAdmin(s.userId, s.retreatId || "");

  const retreats = await prisma.retreatAttendance.findMany({
    where: { userId: s.userId, retreat: { active: true } },
    orderBy: { createdAt: "desc" },
    include: { retreat: true },
  });

  return (
    <div className="space-y-5 max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Profile</h1>
        <p className="text-sm text-stone-400 mt-0.5">Manage your account settings</p>
      </div>
      <form action={updateName} className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Name</label>
          <input
            name="name"
            defaultValue={s.name || ""}
            className="w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Email</label>
          <input
            disabled
            value={s.email || ""}
            className="w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm bg-stone-100/50 text-stone-400"
          />
        </div>
        <button className="bg-accent-500 text-white rounded-md px-5 py-2.5 text-sm font-semibold hover:bg-accent-600 transition">
          Save changes
        </button>
      </form>

      {retreats.length > 1 && (
        <div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm p-6">
          <h2 className="text-sm font-semibold text-stone-700 mb-3">Your retreats</h2>
          <div className="space-y-2">
            {retreats.map((a) => {
              const isCurrent = a.retreatId === s.retreatId;
              if (isCurrent) {
                return (
                  <div
                    key={a.retreatId}
                    className="flex items-center justify-between rounded-md border border-accent-200 bg-accent-50/40 px-4 py-3 text-sm font-medium text-accent-700"
                  >
                    <span>{a.retreat.name}</span>
                    <span className="text-xs text-accent-500">Current</span>
                  </div>
                );
              }
              const action = switchRetreat.bind(null, a.retreatId);
              return (
                <form key={a.retreatId} action={action}>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-between rounded-md border border-stone-200 bg-stone-50/60 px-4 py-3 text-sm font-medium text-stone-700 hover:border-accent-300 hover:bg-accent-50 hover:text-accent-700 transition"
                  >
                    <span>{a.retreat.name}</span>
                    <span className="text-xs text-stone-400">Switch</span>
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      )}

      {admin && (
        <a
          href={`/admin/${s.retreatId}`}
          className="group flex items-center justify-between overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm p-5 hover:border-accent-200 hover:bg-accent-50/30 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-accent-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-stone-700 group-hover:text-accent-600 transition">Admin panel</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-stone-300 group-hover:text-accent-500 transition">
            <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </a>
      )}

      <div className="flex gap-3">
        <form action="/api/auth/logout" method="post">
          <button className="text-sm text-stone-500 font-medium border border-stone-200 rounded-md px-4 py-2 hover:bg-stone-50 transition">
            Log out
          </button>
        </form>
        <DeleteButton action={deleteAccount} />
      </div>
    </div>
  );
}
