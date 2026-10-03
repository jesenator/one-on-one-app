import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ImportProfileClient from "./ImportProfileClient";

export default async function ImportProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ retreat?: string }>;
}) {
  const s = await getSession();
  if (!s.userId) redirect("/login");

  const { retreat: retreatId } = await searchParams;

  const user = await prisma.user.findUnique({ where: { id: s.userId } });

  const initialData = {
    name: user?.name ?? s.name ?? "",
    email: user?.email ?? s.email ?? "",
    tagline: user?.tagline ?? undefined,
    careerStage: user?.careerStage ?? undefined,
    aboutMe: user?.aboutMe ?? undefined,
    goals: user?.goals ?? undefined,
    canHelpWith: user?.canHelpWith ?? undefined,
    linkedinUrl: user?.linkedinUrl ?? undefined,
    websiteUrl: user?.websiteUrl ?? undefined,
    photoUrl: user?.photoUrl ?? undefined,
  };

  return (
    <main className="min-h-screen bg-stone-50 py-12 px-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Welcome! Set up your profile</h1>
          <p className="text-sm text-stone-500 mt-2 leading-relaxed">
            You can optionally upload a profile CSV from a previous retreat to pre-fill your profile.
          </p>
        </div>
        <ImportProfileClient retreatId={retreatId} initialData={initialData} />
      </div>
    </main>
  );
}
