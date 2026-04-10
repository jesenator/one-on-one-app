"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatSlotTime, formatSlotDay } from "@/lib/format";

type SlotMeeting = {
  requestId: string;
  otherPersonName: string;
  otherPersonId: string;
  type: "confirmed" | "incoming" | "outgoing";
};

type Props = {
  groups: Record<string, string[]>;
  availableSlots: string[];
  slotMeetings: Record<string, SlotMeeting>;
  highlightedSlots: string[];
  now: string;
  hasConfirmed: boolean;
};

type SlotState =
  | { kind: "confirmed"; meeting: SlotMeeting }
  | { kind: "incoming"; meeting: SlotMeeting }
  | { kind: "outgoing"; meeting: SlotMeeting }
  | { kind: "available" }
  | { kind: "blocked" }
  | { kind: "past" };

export default function CalendarView({
  groups,
  availableSlots,
  slotMeetings: initialSlotMeetings,
  highlightedSlots,
  now,
  hasConfirmed,
}: Props) {
  const router = useRouter();
  const [available, setAvailable] = useState<Set<string>>(
    new Set(availableSlots),
  );
  const [meetings, setMeetings] =
    useState<Record<string, SlotMeeting>>(initialSlotMeetings);
  const highlighted = new Set(highlightedSlots);
  const nowMs = new Date(now).getTime();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const days = Object.keys(groups).sort();

  const firstNonPastDay =
    days.find((d) => {
      const slots = groups[d];
      return slots.some((iso) => new Date(iso).getTime() >= nowMs);
    }) ?? days[0];
  const [activeDay, setActiveDay] = useState(firstNonPastDay);

  function classify(iso: string): SlotState {
    if (new Date(iso).getTime() < nowMs) return { kind: "past" };
    const m = meetings[iso];
    if (m) {
      if (m.type === "confirmed") return { kind: "confirmed", meeting: m };
      if (m.type === "incoming") return { kind: "incoming", meeting: m };
      return { kind: "outgoing", meeting: m };
    }
    if (available.has(iso)) return { kind: "available" };
    return { kind: "blocked" };
  }

  async function toggleBlock(iso: string) {
    const isAvailable = available.has(iso);
    const next = new Set(available);
    if (isAvailable) next.delete(iso);
    else next.add(iso);
    setAvailable(next);
    startTransition(async () => {
      await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotStart: iso, available: !isAvailable }),
      });
    });
  }

  async function act(
    id: string,
    action: "accept" | "decline" | "cancel",
    iso: string,
  ) {
    setBusy(id);
    const res = await fetch(`/api/requests/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Failed");
      return;
    }
    const updated = { ...meetings };
    if (action === "accept") {
      updated[iso] = { ...updated[iso], type: "confirmed" };
    } else if (action === "decline" || action === "cancel") {
      delete updated[iso];
    }
    setMeetings(updated);
    startTransition(() => router.refresh());
  }

  function renderSlot(iso: string) {
    const state = classify(iso);
    const isHighlighted = highlighted.has(iso);
    const time = formatSlotTime(new Date(iso));

    const base =
      "slot-card flex items-center gap-2 px-3 py-2 rounded-md border text-sm";
    const highlightCls = isHighlighted
      ? "ring-2 ring-amber-400/60 border-amber-300 bg-amber-50/40"
      : "";

    if (state.kind === "past") {
      return (
        <div
          key={iso}
          className={`${base} opacity-25 border-stone-100 bg-stone-50 ${highlightCls}`}
        >
          <span className="text-xs text-stone-400 w-16 shrink-0 font-medium">
            {time}
          </span>
        </div>
      );
    }

    if (state.kind === "confirmed") {
      return (
        <div
          key={iso}
          className={`${base} border-emerald-200 bg-emerald-50 ${highlightCls}`}
        >
          <span className="text-xs text-emerald-700 w-16 shrink-0 font-semibold">
            {time}
          </span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-sm font-medium text-emerald-900 truncate flex-1">
            {state.meeting.otherPersonName}
          </span>
          <div className="flex gap-1.5 shrink-0">
            <a
              href={`/api/meetings/${state.meeting.requestId}/ics`}
              className="p-1 border border-emerald-200 text-emerald-600 rounded hover:bg-emerald-100 transition"
              title="Download .ics"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
              </svg>
            </a>
            <button
              onClick={() => {
                if (window.confirm("Cancel this 1:1?"))
                  act(state.meeting.requestId, "cancel", iso);
              }}
              disabled={busy === state.meeting.requestId}
              className="px-2 py-0.5 border border-red-200 text-red-500 rounded text-[11px] font-medium hover:bg-red-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    if (state.kind === "incoming") {
      return (
        <div
          key={iso}
          className={`${base} border-amber-200 bg-amber-50 ${highlightCls}`}
        >
          <span className="text-xs text-amber-700 w-16 shrink-0 font-semibold">
            {time}
          </span>
          <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
          <span className="text-sm font-medium text-amber-900 truncate flex-1">
            {state.meeting.otherPersonName}
          </span>
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={() => act(state.meeting.requestId, "accept", iso)}
              disabled={busy === state.meeting.requestId}
              className="px-2.5 py-0.5 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={() => act(state.meeting.requestId, "decline", iso)}
              disabled={busy === state.meeting.requestId}
              className="px-2.5 py-0.5 border border-stone-200 text-stone-500 rounded text-[11px] font-medium hover:bg-stone-50 transition disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        </div>
      );
    }

    if (state.kind === "outgoing") {
      return (
        <div
          key={iso}
          className={`${base} border-stone-200 bg-white ${highlightCls}`}
        >
          <span className="text-xs text-stone-500 w-16 shrink-0 font-medium">
            {time}
          </span>
          <div className="w-2 h-2 rounded-full bg-stone-300 shrink-0" />
          <span className="text-sm font-medium text-stone-600 truncate flex-1">
            {state.meeting.otherPersonName}
          </span>
          <span className="text-[11px] text-stone-400 shrink-0 italic">waiting</span>
          <button
            onClick={() => {
              if (window.confirm("Cancel this request?"))
                act(state.meeting.requestId, "cancel", iso);
            }}
            disabled={busy === state.meeting.requestId}
            className="px-2 py-0.5 border border-stone-200 text-stone-400 rounded text-[11px] hover:bg-stone-50 hover:text-stone-600 transition shrink-0"
          >
            Cancel
          </button>
        </div>
      );
    }

    if (state.kind === "available") {
      return (
        <div
          key={iso}
          className={`${base} border-stone-200 bg-white hover:border-accent-200 hover:bg-accent-50 ${highlightCls}`}
        >
          <span className="text-xs text-stone-600 w-16 shrink-0 font-medium">
            {time}
          </span>
          <button
            onClick={() => router.push(`/attendees?slot=${iso}`)}
            className="text-sm text-stone-500 truncate flex-1 text-left hover:text-accent-600 transition cursor-pointer font-medium"
          >
            Available &rarr;
          </button>
          <button
            onClick={() => toggleBlock(iso)}
            className="px-2 py-0.5 border border-stone-200 text-stone-400 rounded text-[11px] hover:bg-stone-100 hover:text-stone-600 transition shrink-0"
          >
            Block
          </button>
        </div>
      );
    }

    // blocked
    return (
      <div
        key={iso}
        className={`${base} border-stone-100 bg-stone-50/50 opacity-50 ${highlightCls}`}
      >
        <span className="text-xs text-stone-400 w-16 shrink-0 font-medium">
          {time}
        </span>
        <span className="text-sm text-stone-400 flex-1">Blocked</span>
        <button
          onClick={() => toggleBlock(iso)}
          className="px-2 py-0.5 border border-stone-200 text-stone-400 rounded text-[11px] hover:bg-stone-100 hover:text-stone-600 transition shrink-0"
        >
          Unblock
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Your Schedule</h1>
          <p className="text-sm text-stone-400 mt-0.5">Manage your availability and meetings</p>
        </div>
        {hasConfirmed && (
          <a
            href="/api/meetings/ics"
            className="text-xs px-3.5 py-2 bg-accent-500 text-white rounded-md font-semibold hover:bg-accent-600 transition inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
            Download all
          </a>
        )}
      </div>

      {/* Legend */}
      <div className="text-xs text-stone-400 flex flex-wrap gap-4 mb-5 pb-4 border-b border-stone-200/60">
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-emerald-500 rounded" />
          confirmed
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-amber-500 rounded" />
          incoming request
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-stone-300 rounded" />
          waiting
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 ring-2 ring-amber-400 bg-amber-50 rounded" />
          designated 1:1 time
        </span>
      </div>

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

      {/* Desktop: columns | Mobile: single day */}
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
              {groups[day].map((iso) => renderSlot(iso))}
            </div>
          </div>
        ))}
      </div>

      <div className="lg:hidden">
        <div className="space-y-1.5">
          {(groups[activeDay] ?? []).map((iso) => renderSlot(iso))}
        </div>
      </div>

    </div>
  );
}
