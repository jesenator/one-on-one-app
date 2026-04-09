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
      {error && <div className="text-sm text-red-600">{error}</div>}
      {days.map((day) => (
        <div key={day}>
          <h3 className="text-sm font-medium mb-2">
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
              let cls = "bg-gray-100 text-gray-400 border-gray-200";
              let label: React.ReactNode = formatSlotTime(new Date(iso));
              if (blocked) {
                cls = "bg-blue-600 text-white border-blue-600";
                label = (
                  <>
                    {formatSlotTime(new Date(iso))}
                    <div className="text-[10px]">booked</div>
                  </>
                );
              } else if (isPending) {
                cls = "bg-yellow-400 text-white border-yellow-400";
                label = (
                  <>
                    {formatSlotTime(new Date(iso))}
                    <div className="text-[10px]">pending</div>
                  </>
                );
              } else if (both) {
                cls =
                  "bg-green-500 text-white border-green-500 hover:bg-green-600 cursor-pointer";
              } else if (isMineOnly) {
                cls = "bg-green-100 text-green-800 border-green-200";
              } else if (isTheirsOnly) {
                cls = "bg-blue-50 text-blue-700 border-blue-100";
              }
              const clickable = both && !blocked && !isPending;
              return (
                <button
                  key={iso}
                  disabled={!clickable || busy === iso}
                  onClick={() => clickable && request(iso)}
                  className={`py-2 rounded text-xs font-medium border transition ${cls}`}
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
      <div className="text-xs text-gray-500 flex flex-wrap gap-3 pt-2">
        <span>
          <span className="inline-block w-3 h-3 bg-green-500 rounded mr-1 align-middle" />
          both free (tap to request)
        </span>
        <span>
          <span className="inline-block w-3 h-3 bg-green-100 border border-green-200 rounded mr-1 align-middle" />
          only you
        </span>
        <span>
          <span className="inline-block w-3 h-3 bg-blue-50 border border-blue-100 rounded mr-1 align-middle" />
          only them
        </span>
        <span>
          <span className="inline-block w-3 h-3 bg-yellow-400 rounded mr-1 align-middle" />
          pending
        </span>
        <span>
          <span className="inline-block w-3 h-3 bg-blue-600 rounded mr-1 align-middle" />
          booked
        </span>
      </div>
    </div>
  );
}
