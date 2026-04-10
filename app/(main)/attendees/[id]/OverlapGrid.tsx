"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatSlotTime, formatSlotDay } from "@/lib/format";

type Props = {
  toUserId: string;
  toUserName: string;
  groups: Record<string, string[]>;
  mine: string[];
  theirs: string[];
  myBookedMeetings: Record<string, string>;
  theirBooked: string[];
  pending: string[];
  now: string;
  preselectedSlot?: string;
};

type SlotState = "available" | "pending" | "booked" | "none";

export default function OverlapGrid({
  toUserId,
  toUserName,
  groups,
  mine,
  theirs,
  myBookedMeetings,
  theirBooked,
  pending,
  now,
  preselectedSlot,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(preselectedSlot ?? null);
  const mineSet = new Set(mine);
  const theirsSet = new Set(theirs);
  const myBookedSet = new Set(Object.keys(myBookedMeetings));
  const theirBookedSet = new Set(theirBooked);
  const [pendingSet, setPendingSet] = useState(new Set(pending));
  const nowMs = new Date(now).getTime();

  async function request(iso: string) {
    setConfirm(null);
    setBusy(iso);
    setError(null);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId, slotStart: iso }),
    });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Failed");
      return;
    }
    setPendingSet(new Set([...pendingSet, iso]));
    router.refresh();
  }

  function classify(iso: string): SlotState | null {
    const isPast = new Date(iso).getTime() < nowMs;
    if (isPast) return null;
    if (myBookedSet.has(iso) || theirBookedSet.has(iso)) return "booked";
    if (pendingSet.has(iso)) return "pending";
    if (mineSet.has(iso) && theirsSet.has(iso)) return "available";
    return "none";
  }

  const days = Object.keys(groups).sort();

  const relevantDays = days
    .map((day) => {
      const slots = groups[day]
        .map((iso) => ({ iso, state: classify(iso) }))
        .filter((s): s is { iso: string; state: SlotState } => s.state !== null);
      return { day, slots };
    })
    .filter((d) => d.slots.some((s) => s.state !== "none"));

  const totalAvailable = relevantDays.reduce(
    (n, d) => n + d.slots.filter((s) => s.state === "available").length,
    0,
  );
  const totalPending = relevantDays.reduce(
    (n, d) => n + d.slots.filter((s) => s.state === "pending").length,
    0,
  );

  const base =
    "slot-card flex items-center gap-2 pl-3 pr-0 py-0 rounded-md border text-sm overflow-hidden min-h-[36px]";

  function renderSlot(iso: string, state: SlotState) {
    const time = formatSlotTime(new Date(iso));

    if (state === "available") {
      return (
        <div
          key={iso}
          className={`${base} border-accent-200 bg-accent-50 hover:bg-accent-100 cursor-pointer transition`}
          onClick={() => setConfirm(iso)}
        >
          <span className="text-xs text-accent-700 w-16 shrink-0 font-semibold">
            {time}
          </span>
          <div className="w-2 h-2 rounded-full bg-accent-500 shrink-0" />
          <span className="text-sm font-medium text-accent-700 truncate flex-1">
            Both free
          </span>
          <div className="flex self-stretch shrink-0 w-[72px] border-l border-accent-200">
            <button
              disabled={busy === iso}
              className="self-stretch flex-1 text-accent-600 text-xs font-semibold hover:bg-accent-200 transition"
            >
              Request
            </button>
          </div>
        </div>
      );
    }

    if (state === "pending") {
      return (
        <div
          key={iso}
          className={`${base} border-amber-200 bg-amber-50`}
        >
          <span className="text-xs text-amber-700 w-16 shrink-0 font-semibold">
            {time}
          </span>
          <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
          <span className="text-sm font-medium text-amber-800 truncate flex-1">
            Requested
          </span>
        </div>
      );
    }

    if (state === "booked") {
      return (
        <div
          key={iso}
          className={`${base} border-stone-100 bg-stone-50 opacity-50`}
        >
          <span className="text-xs text-stone-400 w-16 shrink-0 font-medium">
            {time}
          </span>
          <span className="text-sm text-stone-400 truncate flex-1">
            Unavailable
          </span>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="space-y-5">
      {/* Legend */}
      <div className="text-xs text-stone-400 flex flex-wrap gap-4 pb-3 border-b border-stone-200/60">
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-accent-500 rounded" />
          both free
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-amber-500 rounded" />
          requested
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-stone-300 rounded" />
          unavailable
        </span>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      {totalAvailable === 0 && totalPending === 0 && (
        <div className="text-sm text-stone-500 bg-white rounded-md border border-stone-200 shadow-sm p-6 text-center">
          No overlapping availability right now.
          <br />
          <span className="text-xs text-stone-400">
            Check back later or update your schedule.
          </span>
        </div>
      )}

      {relevantDays.map(({ day, slots }) => (
        <div key={day}>
          <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2.5">
            {formatSlotDay(new Date(day))}
          </h3>
          <div className="space-y-1.5">
            {slots.map(({ iso, state }) => renderSlot(iso, state))}
          </div>
        </div>
      ))}

      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-backdrop"
          onClick={() => setConfirm(null)}
        >
          <div
            className="bg-white rounded-lg border border-stone-200 shadow-lg p-6 w-full max-w-sm mx-4 animate-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-md bg-accent-500 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-5 h-5">
                <path d="M5.25 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75V12ZM6 13.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V14a.75.75 0 0 0-.75-.75H6ZM7.25 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H8a.75.75 0 0 1-.75-.75V12ZM8 13.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V14a.75.75 0 0 0-.75-.75H8ZM9.25 10a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H10a.75.75 0 0 1-.75-.75V10Z" />
                <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-1">Request 1:1</h3>
            <p className="text-sm text-stone-500 mb-5">
              Meet with <span className="font-semibold text-stone-700">{toUserName}</span> on{" "}
              <span className="font-semibold text-stone-700">
                {formatSlotDay(new Date(confirm))}
              </span>{" "}
              at{" "}
              <span className="font-semibold text-stone-700">
                {formatSlotTime(new Date(confirm))}
              </span>
              ?
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setConfirm(null)}
                className="px-4 py-2 text-sm font-medium border border-stone-200 rounded-md hover:bg-stone-50 transition text-stone-600"
              >
                Cancel
              </button>
              <button
                onClick={() => request(confirm)}
                disabled={busy === confirm}
                className="px-4 py-2 text-sm font-semibold bg-accent-500 text-white rounded-md hover:bg-accent-600 transition disabled:opacity-50"
              >
                {busy === confirm ? "Sending..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
