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
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-xl font-semibold mb-4">Pick your retreat</h1>
        <ul className="space-y-2">
          {retreats.map((r) => (
            <li key={r.id}>
              <form action={selectRetreat}>
                <input type="hidden" name="retreatId" value={r.id} />
                <button
                  type="submit"
                  className="w-full text-left border rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-gray-500">{r.timezone}</div>
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
