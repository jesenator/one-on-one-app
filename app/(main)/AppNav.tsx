"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/schedule", label: "Schedule" },
  { href: "/attendees", label: "Attendees" },
  { href: "/profile", label: "Profile" },
];

export default function AppNav({ admin }: { admin: boolean }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 text-sm">
      {TABS.map((t) => {
        const active = path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-md px-3 py-1.5 ${
              active
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
      {admin && (
        <Link
          href="/admin"
          className={`rounded-md px-3 py-1.5 ${
            path.startsWith("/admin")
              ? "bg-zinc-900 text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          Admin
        </Link>
      )}
    </nav>
  );
}
