import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getRetreat, isAdminEmail } from "@/lib/config";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session.userId || !session.retreatId) redirect("/login");
  const retreat = getRetreat(session.retreatId);
  const admin = isAdminEmail(session.email || "");

  const tabs = [
    { href: "/app/schedule", label: "Schedule" },
    { href: "/app/attendees", label: "Attendees" },
    { href: "/app/requests", label: "Requests" },
    { href: "/app/profile", label: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm">{retreat?.name}</div>
          <div className="text-xs text-gray-500">{session.name}</div>
        </div>
        {admin && (
          <Link
            href="/admin"
            className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800"
          >
            Admin
          </Link>
        )}
      </header>
      <main className="flex-1 pb-20">{children}</main>
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t flex justify-around py-2 safe-area-bottom">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="text-xs text-gray-700 hover:text-black px-3 py-1"
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
