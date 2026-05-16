import Link from "next/link";
import BrandMark from "../BrandMark";
import DemoNav from "./DemoNav";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="h-0.5 bg-accent-500" />
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-6 py-3">
          <div className="flex items-center justify-between gap-2">
            <Link href="/demo/schedule" className="flex min-w-0 flex-1 items-center gap-2.5 group">
              <BrandMark size="sm" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-stone-900 group-hover:text-accent-500 truncate">
                  Pairwise
                </div>
                <div className="text-[11px] text-stone-400 leading-none truncate">
                  Demo Retreat
                </div>
              </div>
            </Link>
            <div className="shrink-0">
              <DemoNav />
            </div>
          </div>
        </div>
      </header>
      <div className="bg-amber-50 border-b border-amber-200/80 text-amber-900 text-xs">
        <div className="mx-auto max-w-5xl px-6 py-2 flex items-center justify-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
          You&rsquo;re viewing a public demo. Everyone here is fictional and no
          requests are actually sent.
        </div>
      </div>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
