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
        className="w-full border rounded-lg px-3 py-2 mb-3"
      />
      <ul className="space-y-1">
        {filtered.map((a) => (
          <li key={a.id}>
            <Link
              href={`/app/attendees/${a.id}`}
              className="block bg-white border rounded-lg p-3 hover:bg-gray-50"
            >
              <div className="font-medium text-sm">{a.name}</div>
              <div className="text-xs text-gray-500">{a.email}</div>
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="text-sm text-gray-500">No matches.</li>
        )}
      </ul>
    </>
  );
}
