"use client";
import { useState } from "react";
import Link from "next/link";

type Attendee = { id: string; name: string; email: string };

export default function AttendeeList({ attendees }: { attendees: Attendee[] }) {
  const [q, setQ] = useState("");
  const filtered = attendees.filter((a) =>
    a.name.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name"
        className="w-full border border-zinc-200 rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">No matches.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
          {filtered.map((a) => (
            <Link
              key={a.id}
              href={`/app/attendees/${a.id}`}
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
