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
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
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

  const style: Record<SlotState, { cls: string; sub?: (iso: string) => string }> = {
    available: {
      cls: "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-sm",
    },
    pending: {
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      sub: () => "pending",
    },
    booked: {
      cls: "bg-zinc-100 text-zinc-400 border-zinc-200",
      sub: () => "unavailable",
    },
    none: {
      cls: "bg-zinc-100 text-zinc-400 border-zinc-200",
    },
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {totalAvailable === 0 && totalPending === 0 ? (
        <div className="text-sm text-zinc-500 bg-zinc-50 rounded-lg p-4 text-center">
          No overlapping availability right now.
          <br />
          <span className="text-xs">
            Check back later or update your schedule.
          </span>
        </div>
      ) : totalAvailable > 0 ? (
        <p className="text-sm text-zinc-600">
          <span className="font-semibold text-emerald-700">{totalAvailable}</span>{" "}
          {totalAvailable === 1 ? "time" : "times"} you&apos;re both free
          {totalPending > 0 && (
            <span className="text-zinc-400">
              {" "}&middot; {totalPending} pending
            </span>
          )}
        </p>
      ) : null}

      {relevantDays.map(({ day, slots }) => (
        <div key={day}>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
            {formatSlotDay(new Date(day))}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
            {slots.map(({ iso, state }) => {
              const { cls, sub } = style[state];
              const clickable = state === "available";
              return (
                <button
                  key={iso}
                  disabled={!clickable || busy === iso}
                  onClick={() => clickable && setConfirm(iso)}
                  className={[
                    "py-2 px-1 rounded-lg text-xs font-medium border transition",
                    cls,
                  ].join(" ")}
                >
                  {formatSlotTime(new Date(iso))}
                  {sub && (
                    <div className="text-[10px] font-normal truncate opacity-75">
                      {sub(iso)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setConfirm(null)}
        >
          <div
            className="bg-white rounded-xl border border-zinc-200 shadow-lg p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold mb-1">Request 1:1</h3>
            <p className="text-sm text-zinc-600 mb-4">
              Meet with {toUserName} on{" "}
              <span className="font-medium">
                {formatSlotDay(new Date(confirm))}
              </span>{" "}
              at{" "}
              <span className="font-medium">
                {formatSlotTime(new Date(confirm))}
              </span>
              ?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirm(null)}
                className="px-4 py-2 text-sm font-medium border border-zinc-200 rounded-md hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => request(confirm)}
                disabled={busy === confirm}
                className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {busy === confirm ? "Sending..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-[11px] text-zinc-400 flex gap-4 pt-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 bg-emerald-600 rounded" />
          both free
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 bg-amber-50 border border-amber-200 rounded" />
          pending
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 bg-zinc-100 border border-zinc-200 rounded" />
          unavailable
        </span>
      </div>
    </div>
  );
}
