import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  const s = await getSession();
  if (s.userId && s.retreatId) redirect("/app/schedule");
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-zinc-50 text-zinc-900">
      <div className="w-full max-w-md bg-white rounded-xl border border-zinc-200 shadow-sm p-8 text-center">
        <h1 className="text-xl font-semibold mb-2">EA Retreat 1:1s</h1>
        <p className="text-sm text-zinc-500">
          Use the link shared by your retreat organizer to get started.
        </p>
      </div>
    </main>
  );
}
