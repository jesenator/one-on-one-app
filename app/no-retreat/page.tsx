import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import HostCTA from "../HostCTA";
import BrandMark from "../BrandMark";

export default async function NoRetreatPage() {
  const s = await getSession();
  if (!s.userId) redirect("/login");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-stone-50 text-stone-900">
      <div className="w-full max-w-md bg-white rounded-lg border border-stone-200 shadow-sm p-10 text-center">
        <div className="mx-auto mb-5 flex justify-center">
          <BrandMark size="lg" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-stone-900">Pairwise</h1>
        <p className="text-sm text-stone-500 leading-relaxed">
          Use the join link shared by your retreat organizer to get started.
        </p>
        <div className="mt-8">
          <form action="/api/auth/logout" method="post">
            <button className="text-sm text-stone-500 font-medium border border-stone-200 rounded-md px-4 py-2 hover:bg-stone-50">
              Log out
            </button>
          </form>
        </div>
      </div>
      <HostCTA />
    </main>
  );
}
