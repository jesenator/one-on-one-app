import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getRetreat } from "@/lib/config";
import { prisma } from "@/lib/prisma";

async function joinRetreat(retreatId: string) {
  "use server";
  const session = await getSession();
  if (!session.userId) redirect(`/login?retreat=${retreatId}`);
  await prisma.retreatAttendance.upsert({
    where: { userId_retreatId: { userId: session.userId, retreatId } },
    update: {},
    create: { userId: session.userId, retreatId },
  });
  session.retreatId = retreatId;
  await session.save();
  redirect("/schedule");
}

export default async function RetreatJoinPage({
  params,
}: {
  params: Promise<{ retreatId: string }>;
}) {
  const { retreatId } = await params;
  const retreat = getRetreat(retreatId);
  if (!retreat || !retreat.active) notFound();

  const session = await getSession();
  if (!session.userId) {
    redirect(`/login?retreat=${retreatId}`);
  }

  const join = joinRetreat.bind(null, retreatId);

  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-50">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-md bg-accent-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-7 h-7">
            <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">{retreat.name}</h1>
        <p className="text-sm text-stone-400 mb-6">Enter this retreat to start scheduling 1:1s</p>
        <form action={join}>
          <button
            type="submit"
            className="px-8 py-3 text-sm font-semibold bg-accent-500 text-white rounded-md hover:bg-accent-600 transition"
          >
            Enter {retreat.name}
          </button>
        </form>
      </div>
    </div>
  );
}
