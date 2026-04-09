import { redirect } from "next/navigation";
import { getActiveRetreats } from "@/lib/config";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

async function selectRetreat(formData: FormData) {
  "use server";
  const retreatId = String(formData.get("retreatId"));
  const session = await getSession();
  if (!session.userId) redirect("/login");
  await prisma.retreatAttendance.upsert({
    where: { userId_retreatId: { userId: session.userId, retreatId } },
    update: {},
    create: { userId: session.userId, retreatId },
  });
  session.retreatId = retreatId;
  await session.save();
  redirect("/app/schedule");
}

export default async function SelectRetreatPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const retreats = getActiveRetreats();
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-zinc-50 text-zinc-900">
      <div className="w-full max-w-md bg-white rounded-xl border border-zinc-200 shadow-sm p-8">
        <h1 className="text-xl font-semibold mb-4">Pick your retreat</h1>
        <ul className="space-y-2">
          {retreats.map((r) => (
            <li key={r.id}>
              <form action={selectRetreat}>
                <input type="hidden" name="retreatId" value={r.id} />
                <button
                  type="submit"
                  className="w-full text-left border border-zinc-200 rounded-lg p-3 hover:bg-zinc-50 transition"
                >
                  <div className="font-medium text-sm">{r.name}</div>
                  <div className="text-xs text-zinc-500">{r.timezone}</div>
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
