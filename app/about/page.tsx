import Link from "next/link";
import { getSession } from "@/lib/session";
import { getRetreat, isSuperAdmin, isRetreatAdmin, getUserRetreats } from "@/lib/config";
import AppNav from "../(main)/AppNav";
import BrandMark from "../BrandMark";

export const metadata = {
  title: "About Pairwise",
  description: "A simple scheduler for 1:1s at retreats and other events.",
};

export default async function AboutPage() {
  const session = await getSession();
  const loggedIn = !!session.userId;
  const retreat = session.retreatId ? await getRetreat(session.retreatId) : null;
  const admin =
    loggedIn &&
    ((await isSuperAdmin(session.userId!)) ||
      (!!session.retreatId && (await isRetreatAdmin(session.userId!, session.retreatId))));
  const retreats = loggedIn ? await getUserRetreats(session.userId!, session.retreatId) : [];

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      <div className="h-0.5 bg-accent-500" />
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-6 py-3">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5 group">
              <BrandMark size="sm" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-stone-900 group-hover:text-accent-500 truncate">Pairwise</div>
                {retreat && (
                  <div className="text-[11px] text-stone-400 leading-none truncate">{retreat.name}</div>
                )}
              </div>
            </Link>
            <div className="shrink-0">
              {loggedIn ? (
                <AppNav
                  admin={admin}
                  adminHref={session.retreatId ? `/admin/${session.retreatId}` : "/admin"}
                  name={session.name}
                  email={session.email}
                  retreats={retreats}
                />
              ) : (
                <Link
                  href="/login"
                  className="flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-100"
                >
                  Log in
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-12 space-y-10">
        <section className="space-y-4 text-stone-700 leading-relaxed">
          <h1 className="text-3xl font-bold text-stone-900 mb-6">About Pairwise</h1>
          <p>
            <strong className="font-semibold text-stone-900">
              Pairwise is a simple scheduler for 1:1s at retreats and other events.
            </strong>{" "}
            Sign in with a magic link, mark the slots you&apos;re free, browse
            other attendees and see when your availability overlaps, then request
            a meeting.
          </p>
          <Link
            href="/demo"
            className="group mt-4 flex items-center justify-between gap-4 rounded-lg border border-accent-200 bg-accent-50/70 p-4 hover:bg-accent-50 hover:border-accent-300"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-accent-700 group-hover:text-accent-800">
                Try the live demo
              </div>
              <div className="text-sm text-stone-600 mt-0.5">
                Click around an example retreat with fake attendees.
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-accent-500 shrink-0 group-hover:translate-x-0.5 transition-transform">
              <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </Link>
          <p>
            Built by{" "}
            <a
              href="https://jessewgilbert.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-600 hover:text-accent-700 underline"
            >
              Jesse Gilbert
            </a>{" "}
            with help from{" "}
            <a
              href="https://saulmunn.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-600 hover:text-accent-700 underline"
            >
              Saul Munn
            </a>
            . Open source on{" "}
            <a
              href="https://github.com/jesenator/one-on-one-app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-600 hover:text-accent-700 underline"
            >
              GitHub
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">Want to use Pairwise?</h2>
          <p className="text-stone-700 leading-relaxed">
            Pairwise is shared with organizers on a case-by-case basis. If you&apos;re running a retreat or
            event and want to use it, email{" "}
            <a
              href="mailto:hello@pairwise.now"
              className="text-accent-600 hover:text-accent-700 underline"
            >
              hello@pairwise.now
            </a>
            .
          </p>
          <p>
            Read about Pairwise in use at the first West Coast EA retreat{" "}
            <a
              href="https://forum.effectivealtruism.org/posts/KbSrfqp6u36goHtDG/we-ran-the-first-west-coast-ea-retreat-a-retrospective#A_new_one_on_one_scheduling_app__Pairwise"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-600 hover:text-accent-700 underline"
            >
              here
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">Doing 1:1s well</h2>
          <p className="text-stone-700 leading-relaxed">
            A great 1:1 is worth a lot more than a mediocre one. Some reading we like:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-stone-700">
            <li>
              <a
                href="https://forum.effectivealtruism.org/posts/pKbTjdopzSEApSQfc/doing-1-on-1s-better-eag-tips-part-ii"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-600 hover:text-accent-700 underline"
              >
                Doing 1-on-1s better — EAG tips Part II
              </a>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900">Feedback</h2>
          <p className="text-stone-700 leading-relaxed">
            Found a bug, have a feature request, or just want to chat? Email{" "}
            <a
              href="mailto:hello@pairwise.now"
              className="text-accent-600 hover:text-accent-700 underline"
            >
              hello@pairwise.now
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
