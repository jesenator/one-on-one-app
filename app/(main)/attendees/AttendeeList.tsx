"use client";
import { useState } from "react";
import Link from "next/link";
import { formatSlotDay, formatSlotTime } from "@/lib/format";

type Attendee = { id: string; name: string; email: string };

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
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-4">
          <span className="text-sm text-amber-800">
            Available at{" "}
            <span className="font-medium">
              {formatSlotDay(new Date(slotFilter))}{" "}
              {formatSlotTime(new Date(slotFilter))}
            </span>
          </span>
          <Link
            href="/attendees"
            className="text-xs text-amber-700 underline hover:text-amber-900 transition"
          >
            Clear filter
          </Link>
        </div>
      )}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or email"
        autoFocus
        className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">No matches.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
          {filtered.map((a) => (
            <Link
              key={a.id}
              href={`/attendees/${a.id}`}
              className="block p-4 hover:bg-zinc-50 transition"
            >
              <div className="font-medium text-sm">{a.name}</div>
              <div className="text-xs text-zinc-500">{a.email}</div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
