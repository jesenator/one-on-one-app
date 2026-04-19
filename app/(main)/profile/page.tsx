import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import DeleteButton from "./DeleteButton";
import SwitchRetreatModal from "./SwitchRetreatModal";
import { switchRetreat } from "../actions";

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

  const retreats = await prisma.retreatAttendance.findMany({
    where: { userId: s.userId, retreat: { active: true } },
    orderBy: { createdAt: "desc" },
    include: { retreat: true },
  });

  return (
    <div className="space-y-5 max-w-lg mx-auto">
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
            className="w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
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
        <button className="bg-accent-500 text-white rounded-md px-5 py-2.5 text-sm font-semibold hover:bg-accent-600">
          Save changes
        </button>
      </form>

      <div className="flex flex-wrap gap-3">
        {retreats.length > 1 && (
          <SwitchRetreatModal
            action={switchRetreat}
            retreats={retreats.map((a) => ({
              retreatId: a.retreatId,
              name: a.retreat.name,
              isCurrent: a.retreatId === s.retreatId,
            }))}
          />
        )}
        <form action="/api/auth/logout" method="post">
          <button className="inline-flex items-center gap-2 text-sm text-stone-500 font-medium border border-stone-200 rounded-md px-4 py-2 hover:bg-stone-50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-stone-400">
              <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114L8.704 10.75h9.546A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
            </svg>
            Log out
          </button>
        </form>
        <DeleteButton action={deleteAccount} />
      </div>
    </div>
  );
}
