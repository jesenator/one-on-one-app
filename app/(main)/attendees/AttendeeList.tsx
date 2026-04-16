"use client";
import { useState } from "react";
import Link from "next/link";
import { formatSlotDay, formatSlotTime } from "@/lib/format";

type Attendee = { id: string; name: string; email: string };

const AVATAR_COLORS = [
  "bg-accent-500",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-stone-600",
  "bg-cyan-600",
  "bg-orange-600",
  "bg-violet-600",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AttendeeList({
  attendees,
  slotFilter,
}: {
  attendees: Attendee[];
  slotFilter?: string;
}) {
  const [q, setQ] = useState("");
  const ql = q.toLowerCase();
  const filtered = attendees.filter(
    (a) =>
      a.name.toLowerCase().includes(ql) || a.email.toLowerCase().includes(ql),
  );
  return (
    <>
      {slotFilter && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-md px-4 py-3 mb-4">
          <span className="text-sm text-amber-800">
            Available at{" "}
            <span className="font-semibold">
              {formatSlotDay(new Date(slotFilter))}{" "}
              {formatSlotTime(new Date(slotFilter))}
            </span>
          </span>
          <Link
            href="/attendees"
            className="text-xs text-amber-600 font-medium bg-amber-100 rounded px-2 py-1 hover:bg-amber-200"
          >
            Clear
          </Link>
        </div>
      )}
      <div className="relative mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email..."
          autoFocus
          className="w-full border border-stone-200 rounded-md pl-10 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
        />
      </div>
      {filtered.length === 0 ? (
        <div className="text-sm text-stone-400 text-center py-8">No matches found.</div>
      ) : (
        <div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm divide-y divide-stone-100">
          {filtered.map((a) => (
            <Link
              key={a.id}
              href={slotFilter ? `/attendees/${a.id}?slot=${encodeURIComponent(slotFilter)}` : `/attendees/${a.id}`}
              className="flex items-center gap-3 p-4 hover:bg-accent-50/40 group"
            >
              <div className={`w-9 h-9 rounded-md ${getAvatarColor(a.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {getInitials(a.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-stone-900 group-hover:text-accent-600">{a.name}</div>
                <div className="text-xs text-stone-400 truncate">{a.email}</div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-stone-300 group-hover:text-accent-500 shrink-0">
                <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
