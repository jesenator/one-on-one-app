"use client";
import { useState, type ReactNode } from "react";
import { formatSlotTime, formatSlotDay } from "@/lib/format";

type SlotGridProps = {
  groups: Record<string, string[]>;
  now: string;
  highlightedSlots?: string[];
  renderSlot: (iso: string, opts: { isHighlighted: boolean; isPast: boolean }) => ReactNode;
  filterSlot?: (iso: string) => boolean;
  emptyDayMessage?: string;
};

function NowBar() {
  return (
    <div className="flex items-center gap-2 -my-0.5 z-20 relative">
      <span className="text-[10px] font-bold text-red-500 shrink-0">Now</span>
      <div className="flex-1 h-0.5 bg-red-500 rounded-full" />
    </div>
  );
}

function DayColumn({
  day,
  slots,
  nowMs,
  highlighted,
  renderSlot,
  filterSlot,
  emptyDayMessage,
}: {
  day: string;
  slots: string[];
  nowMs: number;
  highlighted: Set<string>;
  renderSlot: SlotGridProps["renderSlot"];
  filterSlot?: SlotGridProps["filterSlot"];
  emptyDayMessage?: string;
}) {
  const filtered = filterSlot ? slots.filter(filterSlot) : slots;

  if (filtered.length === 0) {
    return emptyDayMessage
      ? <div className="text-xs text-stone-300 py-2">{emptyDayMessage}</div>
      : null;
  }

  let nowInserted = false;
  const elements: ReactNode[] = [];

  for (let i = 0; i < filtered.length; i++) {
    const iso = filtered[i];
    const slotMs = new Date(iso).getTime();
    const nextMs = i + 1 < filtered.length ? new Date(filtered[i + 1]).getTime() : null;

    if (!nowInserted && slotMs <= nowMs && (nextMs === null || nextMs > nowMs)) {
      elements.push(
        renderSlot(iso, { isHighlighted: highlighted.has(iso), isPast: slotMs < nowMs }),
      );
      if (nextMs !== null) {
        elements.push(<NowBar key="now-bar" />);
      }
      nowInserted = true;
    } else {
      elements.push(
        renderSlot(iso, { isHighlighted: highlighted.has(iso), isPast: slotMs < nowMs }),
      );
    }
  }

  // If now is before the first slot of the day but on this day, show bar at the top
  if (!nowInserted && filtered.length > 0) {
    const firstMs = new Date(filtered[0]).getTime();
    const dayStr = filtered[0].slice(0, 10);
    const nowDayStr = new Date(nowMs).toISOString().slice(0, 10);
    if (nowDayStr === dayStr && nowMs < firstMs) {
      elements.unshift(<NowBar key="now-bar" />);
    }
  }

  return <>{elements}</>;
}

export default function SlotGrid({
  groups,
  now,
  highlightedSlots = [],
  renderSlot,
  filterSlot,
  emptyDayMessage,
}: SlotGridProps) {
  const nowMs = new Date(now).getTime();
  const highlighted = new Set(highlightedSlots);
  const days = Object.keys(groups).sort();

  const firstNonPastDay =
    days.find((d) => {
      const slots = filterSlot ? groups[d].filter(filterSlot) : groups[d];
      return slots.some((iso) => new Date(iso).getTime() >= nowMs);
    }) ?? days[0];
  const [activeDay, setActiveDay] = useState(firstNonPastDay);

  const columnProps = (day: string) => ({
    day,
    slots: groups[day],
    nowMs,
    highlighted,
    renderSlot,
    filterSlot,
    emptyDayMessage,
  });

  return (
    <>
      {/* Mobile: Day tabs */}
      <div className="flex gap-1.5 mb-5 lg:hidden overflow-x-auto">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={[
              "flex-1 py-2.5 rounded-md text-sm font-semibold transition border min-w-0",
              activeDay === day
                ? "bg-accent-500 text-white border-accent-500"
                : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50 hover:text-stone-700",
            ].join(" ")}
          >
            {formatSlotDay(new Date(day))}
          </button>
        ))}
      </div>

      {/* Desktop: columns */}
      <div
        className="hidden lg:grid gap-5"
        style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}
      >
        {days.map((day) => (
          <div key={day}>
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 sticky top-0 bg-stone-50 py-1.5 z-10">
              {formatSlotDay(new Date(day))}
            </h3>
            <div className="space-y-1.5">
              <DayColumn {...columnProps(day)} />
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: single day */}
      <div className="lg:hidden">
        <div className="space-y-1.5">
          <DayColumn {...columnProps(activeDay)} />
        </div>
      </div>
    </>
  );
}
