"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatSlotTime, formatSlotDay } from "@/lib/format";

type Props = {
  toUserId: string;
  groups: Record<string, string[]>;
  mine: string[];
  theirs: string[];
  myBooked: string[];
  theirBooked: string[];
  pending: string[];
};

export default function OverlapGrid({
  toUserId,
  groups,
  mine,
  theirs,
  myBooked,
  theirBooked,
  pending,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mineSet = new Set(mine);
  const theirsSet = new Set(theirs);
  const myBookedSet = new Set(myBooked);
  const theirBookedSet = new Set(theirBooked);
  const [pendingSet, setPendingSet] = useState(new Set(pending));

  async function request(iso: string) {
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

  const days = Object.keys(groups).sort();
  return (
    <div className="space-y-6">
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}
      {days.map((day) => (
        <div key={day}>
          <h3 className="text-sm font-semibold text-zinc-700 mb-2">
            {formatSlotDay(new Date(day))}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
            {groups[day].map((iso) => {
              const both = mineSet.has(iso) && theirsSet.has(iso);
              const blocked =
                myBookedSet.has(iso) || theirBookedSet.has(iso);
              const isPending = pendingSet.has(iso);
              const isMineOnly = mineSet.has(iso) && !theirsSet.has(iso);
              const isTheirsOnly = !mineSet.has(iso) && theirsSet.has(iso);
              let cls = "bg-zinc-50 text-zinc-400 border-zinc-200";
              let label: React.ReactNode = formatSlotTime(new Date(iso));
              if (blocked) {
                cls = "bg-violet-100 text-violet-800 border-violet-300";
                label = (
                  <>
                    {formatSlotTime(new Date(iso))}
                    <div className="text-[10px]">booked</div>
                  </>
                );
              } else if (isPending) {
                cls = "bg-amber-100 text-amber-800 border-amber-300";
                label = (
                  <>
                    {formatSlotTime(new Date(iso))}
                    <div className="text-[10px]">pending</div>
                  </>
                );
              } else if (both) {
                cls =
                  "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 cursor-pointer";
              } else if (isMineOnly) {
                cls = "bg-emerald-50 text-emerald-700 border-emerald-200";
              } else if (isTheirsOnly) {
                cls = "bg-zinc-100 text-zinc-500 border-zinc-200";
              }
              const clickable = both && !blocked && !isPending;
              return (
                <button
                  key={iso}
                  disabled={!clickable || busy === iso}
                  onClick={() => clickable && request(iso)}
                  className={`py-2 rounded-md text-xs font-medium border transition ${cls}`}
                  title={
                    clickable
                      ? "Request 1:1"
                      : both
                        ? "unavailable"
                        : "not mutually available"
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="text-xs text-zinc-500 flex flex-wrap gap-4 pt-2">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-emerald-600 rounded" />
          both free (tap to request)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-emerald-50 border border-emerald-200 rounded" />
          only you
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-zinc-100 border border-zinc-200 rounded" />
          only them
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-amber-100 border border-amber-300 rounded" />
          pending
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-violet-100 border border-violet-300 rounded" />
          booked
        </span>
      </div>
    </div>
  );
}
