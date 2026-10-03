import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getUserRetreats } from "@/lib/config";
import { switchRetreat } from "@/app/(main)/actions";
import DeleteButton from "./DeleteButton";
import SwitchRetreatModal from "./SwitchRetreatModal";
import ProfileForm from "./ProfileForm";
import BrandMark from "@/app/BrandMark";

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

export default async function ProfilePage() {
  const s = await getSession();
  if (!s.userId) redirect("/login");

  const [retreats, user] = await Promise.all([
    getUserRetreats(s.userId, s.retreatId),
    prisma.user.findUnique({ where: { id: s.userId } }),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="h-0.5 bg-accent-500" />
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between gap-2">
          <Link href={s.retreatId ? "/schedule" : "/no-retreat"} className="flex items-center gap-2.5 group">
            <BrandMark size="sm" />
            <span className="text-sm font-semibold text-stone-900 group-hover:text-accent-500">Pairwise</span>
          </Link>
          {s.retreatId && (
            <Link href="/schedule" className="text-xs text-stone-500 hover:text-stone-700">
              ← Back to schedule
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="space-y-5 max-w-lg mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-stone-900">Profile</h1>
            <p className="text-sm text-stone-400 mt-0.5">Manage your account settings</p>
          </div>

          <ProfileForm
            user={{
              name: user.name,
              email: user.email,
              tagline: user.tagline,
              careerStage: user.careerStage,
              aboutMe: user.aboutMe,
              goals: user.goals,
              canHelpWith: user.canHelpWith,
              linkedinUrl: user.linkedinUrl,
              websiteUrl: user.websiteUrl,
              photoUrl: user.photoUrl,
            }}
          />

          <div className="flex flex-wrap gap-3">
            {retreats.length > 1 && (
              <SwitchRetreatModal action={switchRetreat} retreats={retreats} />
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
            <a
              href="/api/user/export"
              className="inline-flex items-center gap-2 text-sm text-stone-500 font-medium border border-stone-200 rounded-md px-4 py-2 hover:bg-stone-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-stone-400">
                <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
              </svg>
              Download profile CSV
            </a>
            <DeleteButton action={deleteAccount} />
          </div>
        </div>
      </main>
    </div>
  );
}
