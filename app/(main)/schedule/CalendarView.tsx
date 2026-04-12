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
};

type SlotState =
  | { kind: "confirmed"; meeting: SlotMeeting; isPast: boolean }
  | { kind: "incoming"; meeting: SlotMeeting; isPast: boolean }
  | { kind: "outgoing"; meeting: SlotMeeting; isPast: boolean }
  | { kind: "available" }
  | { kind: "blocked" }
  | { kind: "past" };

export default function CalendarView({
  groups,
  availableSlots,
  slotMeetings: initialSlotMeetings,
  highlightedSlots,
  now,
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
  const [showPendingModal, setShowPendingModal] = useState(false);

  const incomingRequests = Object.entries(meetings)
    .filter(
      ([iso, m]) => m.type === "incoming" && new Date(iso).getTime() >= nowMs,
    )
    .sort(([a], [b]) => a.localeCompare(b));

  // Derive modal visibility — auto-hides when the list empties without needing a useEffect
  const modalOpen = showPendingModal && incomingRequests.length > 0;

  const days = Object.keys(groups).sort();

  const firstNonPastDay =
    days.find((d) => {
      const slots = groups[d];
      return slots.some((iso) => new Date(iso).getTime() >= nowMs);
    }) ?? days[0];
  const [activeDay, setActiveDay] = useState(firstNonPastDay);

  function classify(iso: string): SlotState {
    const isPast = new Date(iso).getTime() < nowMs;
    const m = meetings[iso];
    if (m) {
      if (m.type === "confirmed")
        return { kind: "confirmed", meeting: m, isPast };
      if (m.type === "incoming")
        return { kind: "incoming", meeting: m, isPast };
      return { kind: "outgoing", meeting: m, isPast };
    }
    if (isPast) return { kind: "past" };
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
      "slot-card flex items-center gap-2 pl-3 pr-0 py-0 rounded-md border text-sm overflow-hidden min-h-[36px]";
    const highlightCls = isHighlighted
      ? "ring-2 ring-amber-400/60 border-amber-300 bg-amber-50/40"
      : "";

    if (state.kind === "past") {
      return (
        <div
          key={iso}
          className={`${base} opacity-60 border-stone-100 bg-stone-50 ${highlightCls}`}
        >
          <span className="text-xs text-stone-400 w-16 shrink-0 font-medium">
            {time}
          </span>
        </div>
      );
    }

    // Past pending requests (incoming/outgoing that never resolved) — show as "missed"
    if (
      (state.kind === "incoming" || state.kind === "outgoing") &&
      state.isPast
    ) {
      return (
        <div
          key={iso}
          className={`${base} border-stone-200 bg-stone-50/60 opacity-90 ${highlightCls}`}
        >
          <span className="text-xs text-stone-400 w-16 shrink-0 font-medium">
            {time}
          </span>
          <div className="w-2 h-2 rounded-full bg-stone-300 shrink-0" />
          <span className="text-sm text-stone-500 truncate flex-1">
            {state.meeting.otherPersonName}
          </span>
          <span className="text-[11px] text-stone-400 shrink-0 italic pr-3">
            missed
          </span>
        </div>
      );
    }

    if (state.kind === "confirmed") {
      const pastCls = state.isPast ? "opacity-50" : "";
      return (
        <div
          key={iso}
          className={`${base} border-emerald-200 bg-emerald-50 ${highlightCls} ${pastCls}`}
        >
          <span className="text-xs text-emerald-700 w-16 shrink-0 font-semibold">
            {time}
          </span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-sm font-medium text-emerald-900 truncate flex-1">
            {state.meeting.otherPersonName}
          </span>
          {!state.isPast && (
            <div className="flex self-stretch shrink-0 w-[72px] border-l border-emerald-200">
              <button
                onClick={() => {
                  if (window.confirm("Cancel this 1:1?"))
                    act(state.meeting.requestId, "cancel", iso);
                }}
                disabled={busy === state.meeting.requestId}
                className="self-stretch flex-1 text-red-400 text-xs font-medium hover:bg-red-50 hover:text-red-600 transition"
              >
                Cancel
              </button>
            </div>
          )}
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
          <div className="flex self-stretch shrink-0 w-[112px] border-l border-amber-200">
            <button
              onClick={() => act(state.meeting.requestId, "accept", iso)}
              disabled={busy === state.meeting.requestId}
              className="self-stretch flex-1 text-emerald-600 text-xs font-semibold hover:bg-emerald-50 transition disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={() => act(state.meeting.requestId, "decline", iso)}
              disabled={busy === state.meeting.requestId}
              className="self-stretch flex-1 border-l border-amber-200 text-stone-400 text-xs font-medium hover:bg-stone-50 hover:text-stone-600 transition disabled:opacity-50"
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
          <span className="text-[11px] text-stone-400 shrink-0 italic">
            waiting
          </span>
          <div className="flex self-stretch shrink-0 w-[72px] border-l border-stone-200">
            <button
              onClick={() => {
                if (window.confirm("Cancel this request?"))
                  act(state.meeting.requestId, "cancel", iso);
              }}
              disabled={busy === state.meeting.requestId}
              className="self-stretch flex-1 text-stone-400 text-xs font-medium hover:bg-stone-50 hover:text-stone-600 transition"
            >
              Cancel
            </button>
          </div>
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
          <div className="flex self-stretch shrink-0 w-[72px] border-l border-stone-200">
            <button
              onClick={() => toggleBlock(iso)}
              className="self-stretch flex-1 text-stone-400 text-xs font-medium hover:bg-stone-100 hover:text-stone-600 transition"
            >
              Block
            </button>
          </div>
        </div>
      );
    }

    // blocked
    return (
      <div
        key={iso}
        className={`${base} border-stone-200 bg-stone-50 ${highlightCls}`}
      >
        <span className="text-xs text-stone-400 w-16 shrink-0 font-medium">
          {time}
        </span>
        <span className="text-sm text-stone-400 flex-1">Blocked</span>
        <div className="flex self-stretch shrink-0 w-[72px] border-l border-stone-200">
          <button
            onClick={() => toggleBlock(iso)}
            className="self-stretch flex-1 text-stone-500 text-xs font-medium hover:bg-stone-100 hover:text-stone-700 transition"
          >
            Unblock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Pending requests banner */}
      {incomingRequests.length > 0 && (
        <button
          onClick={() => setShowPendingModal(true)}
          className="w-full mb-4 bg-red-50 border border-red-300 rounded-md px-4 py-3 flex items-center justify-between gap-3 hover:bg-red-100 transition group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-sm font-semibold text-red-800 truncate">
              You have {incomingRequests.length} pending 1:1 {incomingRequests.length === 1 ? "request" : "requests"}
            </span>
          </div>
          <span className="text-xs text-red-700 font-semibold shrink-0 group-hover:translate-x-0.5 transition-transform">
            Review &rarr;
          </span>
        </button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Your Schedule</h1>
          <p className="text-sm text-stone-400 mt-0.5">Manage your availability and meetings</p>
        </div>
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
        {highlightedSlots.length > 0 && (
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 ring-2 ring-amber-400 bg-amber-50 rounded" />
            designated 1:1 time
          </span>
        )}
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

      {/* Pending requests modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-backdrop"
          onClick={() => setShowPendingModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col animate-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-stone-900">Pending 1:1 Requests</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {incomingRequests.length} waiting on your response
                </p>
              </div>
              <button
                onClick={() => setShowPendingModal(false)}
                className="text-stone-400 hover:text-stone-700 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded hover:bg-stone-100 transition"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-stone-100">
              {incomingRequests.map(([iso, m]) => (
                <div
                  key={iso}
                  className="px-5 py-3 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-stone-900 truncate">
                      {m.otherPersonName}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {formatSlotDay(new Date(iso))} · {formatSlotTime(new Date(iso))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => act(m.requestId, "accept", iso)}
                      disabled={busy === m.requestId}
                      className="px-3 py-1.5 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => act(m.requestId, "decline", iso)}
                      disabled={busy === m.requestId}
                      className="px-3 py-1.5 rounded-md border border-stone-200 bg-white text-stone-500 text-xs font-medium hover:bg-stone-50 hover:text-stone-700 transition disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
