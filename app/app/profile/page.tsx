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
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">Profile</h1>
      <form action={updateName} className="bg-white border rounded-lg p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            name="name"
            defaultValue={s.name || ""}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            disabled
            value={s.email || ""}
            className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-500"
          />
        </div>
        <button className="bg-black text-white rounded px-4 py-2 text-sm">
          Save
        </button>
      </form>

      {admin && (
        <a
          href="/admin"
          className="block bg-amber-100 text-amber-900 rounded-lg p-3 text-sm font-medium"
        >
          Open admin panel →
        </a>
      )}

      <form action={leaveRetreat}>
        <button className="text-sm text-gray-600 underline">
          Switch retreat
        </button>
      </form>
      <form action="/api/auth/logout" method="post">
        <button className="text-sm text-red-600 underline">Log out</button>
      </form>
    </div>
  );
}
