"use client";

import { useState } from "react";

function fmtTime(iso: string) {
  const d = new Date(iso);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${m.toString().padStart(2, "0")}${ampm}`;
}

function fmtDay(day: string) {
  const d = new Date(day + "T00:00:00Z");
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()]
    + " " + (d.getUTCMonth() + 1) + "/" + d.getUTCDate();
}

export default function SlotChipPicker({
  groups,
  initial,
}: {
  groups: Record<string, string[]>;
  initial: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initial));
  const days = Object.keys(groups).sort();

  function toggle(iso: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });
  }

  return (
    <div>
      <input type="hidden" name="highlightedSlots" value={Array.from(selected).sort().join("\n")} />
      <div className="space-y-2">
        {days.map((day) => (
          <div key={day} className="flex items-start gap-2">
            <span className="text-[11px] font-semibold text-stone-500 w-16 shrink-0 pt-1">{fmtDay(day)}</span>
            <div className="flex flex-wrap gap-1">
              {groups[day].map((iso) => {
                const on = selected.has(iso);
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => toggle(iso)}
                    className={[
                      "px-2 py-0.5 rounded-full text-[11px] font-medium border",
                      on
                        ? "bg-amber-100 border-amber-300 text-amber-800"
                        : "bg-stone-50 border-stone-200 text-stone-400 hover:border-amber-200 hover:text-amber-700",
                    ].join(" ")}
                  >
                    {fmtTime(iso)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {selected.size > 0 && (
        <div className="text-[11px] text-stone-400 mt-2">{selected.size} slot{selected.size !== 1 ? "s" : ""} highlighted</div>
      )}
    </div>
  );
}
