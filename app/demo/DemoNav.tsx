"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/demo/schedule",
    label: "Schedule",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2ZM4.75 7.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/demo/attendees",
    label: "Attendees",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
      </svg>
    ),
  },
];

export default function DemoNav() {
  const path = usePathname();
  return (
    <nav className="flex items-center gap-1 text-sm">
      {TABS.map((t) => {
        const active = path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium ${
              active
                ? "bg-accent-50 text-accent-600"
                : "text-stone-500 hover:text-stone-700 hover:bg-stone-100"
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </Link>
        );
      })}
      <Link
        href="/about"
        className="flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-100"
      >
        About
      </Link>
      <Link
        href="/login"
        className="flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-100"
      >
        Log in
      </Link>
    </nav>
  );
}
