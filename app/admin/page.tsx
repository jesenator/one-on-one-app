import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/config";
import ConfirmButton from "./ConfirmButton";

async function createRetreat(formData: FormData) {
  "use server";
  const s = await getSession();
  if (!s.userId || !(await isSuperAdmin(s.userId))) redirect("/schedule");
  const id = String(formData.get("id") || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const name = String(formData.get("name") || "").trim();
  const timezone = String(formData.get("timezone") || "").trim();
  const slotsStart = String(formData.get("slotsStart") || "").trim();
  const slotsEnd = String(formData.get("slotsEnd") || "").trim();
  const dayStart = String(formData.get("dayStart") || "08:00").trim();
  const dayEnd = String(formData.get("dayEnd") || "22:00").trim();
  const granularity = Number(formData.get("granularityMinutes")) || 30;
  if (!id || !name || !timezone || !slotsStart || !slotsEnd) redirect("/admin");
  await prisma.retreat.create({
    data: { id, name, timezone, slotsStart, slotsEnd, dayStart, dayEnd, granularityMinutes: granularity, highlightedSlots: [] },
  });
  redirect(`/admin/${id}`);
}

async function addSuperAdmin(formData: FormData) {
  "use server";
  const s = await getSession();
  if (!s.userId || !(await isSuperAdmin(s.userId))) redirect("/schedule");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) redirect("/admin");
  await prisma.user.updateMany({ where: { email }, data: { superAdmin: true } });
  redirect("/admin");
}

async function removeSuperAdmin(formData: FormData) {
  "use server";
  const s = await getSession();
  if (!s.userId || !(await isSuperAdmin(s.userId))) redirect("/schedule");
  const userId = String(formData.get("userId"));
  if (userId === s.userId) redirect("/admin");
  await prisma.user.update({ where: { id: userId }, data: { superAdmin: false } });
  redirect("/admin");
}

export default async function AdminPage() {
  const s = await getSession();
  if (!s.userId) redirect("/login");
  if (!(await isSuperAdmin(s.userId))) redirect("/schedule");

  const [retreats, superAdmins] = await Promise.all([
    prisma.retreat.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.user.findMany({ where: { superAdmin: true }, orderBy: { name: "asc" } }),
  ]);

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
            <span className="text-sm font-semibold">App Admin</span>
          </div>
          <Link href="/schedule" className="text-sm text-stone-500 hover:text-accent-600 transition font-medium inline-flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
            Back to app
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-8 animate-fade-in">
        <div>
          <h2 className="text-sm font-bold text-stone-700 mb-3">Retreats</h2>
          <div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm divide-y divide-stone-100">
            {retreats.map((r) => (
              <Link
                key={r.id}
                href={`/admin/${r.id}`}
                className="p-4 flex items-center justify-between text-sm hover:bg-stone-50 transition"
              >
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-stone-400">
                    {r.id} &middot; {r.timezone} &middot;{" "}
                    <span className={r.active ? "text-emerald-600" : "text-stone-400"}>{r.active ? "Active" : "Inactive"}</span>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-stone-300">
                  <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </Link>
            ))}
            {retreats.length === 0 && (
              <div className="p-4 text-xs text-stone-400">No retreats yet.</div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-stone-700 mb-3">Create retreat</h2>
          <form action={createRetreat} className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Slug (ID)</label>
                <input name="id" required placeholder="midwest-ea-2026" className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Name</label>
                <input name="name" required placeholder="Midwest EA Retreat" className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Timezone</label>
              <input name="timezone" required placeholder="America/Chicago" className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Slots start</label>
                <input name="slotsStart" type="datetime-local" required className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Slots end</label>
                <input name="slotsEnd" type="datetime-local" required className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Day start</label>
                <input name="dayStart" type="time" defaultValue="08:00" className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Day end</label>
                <input name="dayEnd" type="time" defaultValue="22:00" className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Slot minutes</label>
                <input name="granularityMinutes" type="number" defaultValue={30} min={5} className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
              </div>
            </div>
            <button className="bg-accent-500 text-white rounded-md px-5 py-2.5 text-sm font-semibold hover:bg-accent-600 transition">
              Create retreat
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-sm font-bold text-stone-700 mb-3">Super admins</h2>
          <div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm divide-y divide-stone-100">
            {superAdmins.map((u) => (
              <div key={u.id} className="p-4 flex items-center justify-between text-sm">
                <div>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-xs text-stone-400">{u.email}</div>
                </div>
                {u.id !== s.userId && (
                  <form action={removeSuperAdmin}>
                    <input type="hidden" name="userId" value={u.id} />
                    <ConfirmButton
                      message={`Remove ${u.name} as super admin?`}
                      label="Remove"
                      className="text-xs text-red-500 font-medium border border-red-200 rounded-md px-2.5 py-1 hover:bg-red-50 transition"
                    />
                  </form>
                )}
              </div>
            ))}
          </div>
          <form action={addSuperAdmin} className="mt-3 flex gap-2">
            <input name="email" type="email" required placeholder="Email address" className="flex-1 border border-stone-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
            <button className="bg-accent-500 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-accent-600 transition">
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
