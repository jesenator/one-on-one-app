"use client";
import { useState, useTransition } from "react";
import { formatSlotTime, formatSlotDay } from "@/lib/format";

type Props = {
  groups: Record<string, string[]>;
  initialSelected: string[];
  bookedSlots: string[];
  now: string;
};

export default function ScheduleGrid({
  groups,
  initialSelected,
  bookedSlots,
  now,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSelected),
  );
  const booked = new Set(bookedSlots);
  const nowMs = new Date(now).getTime();
  const [, startTransition] = useTransition();

  async function toggle(iso: string) {
    if (booked.has(iso)) return;
    const next = new Set(selected);
    const isAvailable = !next.has(iso);
    if (isAvailable) next.add(iso);
    else next.delete(iso);
    setSelected(next);
    startTransition(async () => {
      await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotStart: iso, available: isAvailable }),
      });
    });
  }

  const days = Object.keys(groups).sort();

  return (
    <div className="space-y-4">
      {days.map((day) => (
        <div key={day}>
          <h3 className="text-xs font-semibold text-zinc-700 mb-1.5">
            {formatSlotDay(new Date(day))}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
            {groups[day].map((iso) => {
              const isSel = selected.has(iso);
              const isBooked = booked.has(iso);
              const isPast = new Date(iso).getTime() < nowMs;
              return (
                <button
                  key={iso}
                  onClick={() => toggle(iso)}
                  disabled={isBooked}
                  className={[
                    "py-1.5 rounded text-[11px] font-medium border transition",
                    isPast || isBooked ? "opacity-40" : "",
                    isBooked
                      ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-default"
                      : isSel
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300",
                  ].join(" ")}
                >
                  {formatSlotTime(new Date(iso))}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="text-xs text-zinc-500 flex gap-4 pt-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-emerald-600 rounded" />
          available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-zinc-100 border border-zinc-200 rounded opacity-40" />
          unavailable
        </span>
      </div>
    </div>
  );
}
