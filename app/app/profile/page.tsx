import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/config";

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
  redirect("/app/profile");
}

async function leaveRetreat() {
  "use server";
  const session = await getSession();
  if (!session.userId || !session.retreatId) redirect("/login");
  session.retreatId = undefined;
  await session.save();
  redirect("/select-retreat");
}

export default async function ProfilePage() {
  const s = await getSession();
  if (!s.userId) redirect("/login");
  const admin = isAdminEmail(s.email || "");
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Profile</h1>
      <form action={updateName} className="overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
          <input
            name="name"
            defaultValue={s.name || ""}
            className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
          <input
            disabled
            value={s.email || ""}
            className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm bg-zinc-50 text-zinc-500"
          />
        </div>
        <button className="bg-zinc-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-zinc-800 transition">
          Save
        </button>
      </form>

      {admin && (
        <a
          href="/admin"
          className="block overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
        >
          Open admin panel &rarr;
        </a>
      )}

      <div className="flex gap-4">
        <form action={leaveRetreat}>
          <button className="text-sm text-zinc-600 border border-zinc-200 rounded-md px-3 py-1.5 hover:bg-zinc-50 transition">
            Switch retreat
          </button>
        </form>
        <form action="/api/auth/logout" method="post">
          <button className="text-sm text-red-600 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-50 transition">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
