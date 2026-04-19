"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SwitchRetreatModal from "./profile/SwitchRetreatModal";
import { switchRetreat } from "./actions";

type RetreatItem = { retreatId: string; name: string; isCurrent: boolean };

const TABS = [
  {
    href: "/schedule",
    label: "Schedule",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2ZM4.75 7.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/attendees",
    label: "Attendees",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
      </svg>
    ),
  },
];

const profileIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z" clipRule="evenodd" />
  </svg>
);

export default function AppNav({
  admin,
  adminHref = "/admin",
  name,
  email,
  retreats = [],
}: {
  admin: boolean;
  adminHref?: string;
  name?: string;
  email?: string;
  retreats?: RetreatItem[];
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const accountActive = path.startsWith("/profile") || path.startsWith("/about");

  return (
    <nav className="flex gap-1 text-sm">
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
      {admin && (
        <Link
          href={adminHref}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium ${
            path.startsWith("/admin")
              ? "bg-accent-50 text-accent-600"
              : "text-stone-500 hover:text-stone-700 hover:bg-stone-100"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">Admin</span>
        </Link>
      )}
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account menu"
          className={`flex items-center rounded-md px-3 py-1.5 font-medium ${
            accountActive || open
              ? "bg-accent-50 text-accent-600"
              : "text-stone-500 hover:text-stone-700 hover:bg-stone-100"
          }`}
        >
          <span className="flex h-5 items-center">{profileIcon}</span>
        </button>
        {open && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-56 rounded-md border border-stone-200 bg-white shadow-lg overflow-hidden z-50"
          >
            {(name || email) && (
              <div className="px-4 py-3 border-b border-stone-200">
                {name && <div className="text-sm font-medium text-stone-900 truncate">{name}</div>}
                {email && <div className="text-xs text-stone-400 truncate">{email}</div>}
              </div>
            )}
            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                role="menuitem"
                className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
              >
                Profile settings
              </Link>
              {retreats.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setSwitchOpen(true);
                  }}
                  role="menuitem"
                  className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                >
                  Switch retreats
                </button>
              )}
              <Link
                href="/about"
                onClick={() => setOpen(false)}
                role="menuitem"
                className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
              >
                About
              </Link>
            </div>
            <div className="border-t border-stone-200 py-1">
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  role="menuitem"
                  className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                >
                  Log out
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      {retreats.length > 1 && (
        <SwitchRetreatModal
          retreats={retreats}
          action={switchRetreat}
          open={switchOpen}
          onClose={() => setSwitchOpen(false)}
        />
      )}
    </nav>
  );
}
