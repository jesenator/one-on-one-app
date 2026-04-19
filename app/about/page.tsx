import Link from "next/link";
import { getSession } from "@/lib/session";
import { getRetreat, isSuperAdmin, isRetreatAdmin } from "@/lib/config";
import AppNav from "../(main)/AppNav";

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

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      <div className="h-0.5 bg-accent-500" />
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-6 py-3">
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5 group">
              <div className="shrink-0 w-8 h-8 rounded-md bg-accent-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                  <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
                </svg>
              </div>
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
        <div>
          <h1 className="text-3xl font-bold text-stone-900">About Pairwise</h1>
          <p className="mt-2 text-stone-500">A simple scheduler for 1:1s at retreats and other events.</p>
        </div>

        <section className="space-y-3 text-stone-700 leading-relaxed">
          <p>
            Pairwise helps people at retreats and other events find time for 1:1 conversations without the
            back-and-forth. Sign in with a magic link, mark the half-hour slots you&apos;re free, browse other
            attendees and see when your availability overlaps, then request a meeting in one tap. Accepted
            meetings lock the slot for both people.
          </p>
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
            and{" "}
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
          <h2 className="text-lg font-semibold text-stone-900">Want to host a retreat?</h2>
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
      </main>

      <footer className="py-4 text-center text-xs text-stone-400">
        Found a bug? Suggest a feature? Contact{" "}
        <a href="mailto:hello@pairwise.now" className="underline hover:text-stone-600">
          hello@pairwise.now
        </a>
      </footer>
    </div>
  );
}
