"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatSlotTime, formatSlotDay } from "@/lib/format";
import SlotGrid from "../../SlotGrid";

type BetweenUsRequest = {
  requestId: string;
  slotStart: string;
  direction: "incoming" | "outgoing";
  status: "pending" | "accepted";
};

type Props = {
  toUserId: string;
  toUserName: string;
  groups: Record<string, string[]>;
  mine: string[];
  theirs: string[];
  myBooked: string[];
  theirBooked: string[];
  betweenUs: BetweenUsRequest[];
  highlightedSlots?: string[];
  now: string;
  preselectedSlot?: string;
};

type SlotState =
  | "available"
  | "pendingOutgoing"
  | "pendingIncoming"
  | "confirmed"
  | "booked"
  | "none";

export default function OverlapGrid({
  toUserId,
  toUserName,
  groups,
  mine,
  theirs,
  myBooked,
  theirBooked,
  betweenUs,
  highlightedSlots = [],
  now,
  preselectedSlot,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(preselectedSlot ?? null);
  const [confirmingCancel, setConfirmingCancel] = useState<string | null>(null);
  const [betweenUsMap, setBetweenUsMap] = useState<Record<string, BetweenUsRequest>>(
    Object.fromEntries(betweenUs.map((p) => [p.slotStart, p])),
  );
  const mineSet = new Set(mine);
  const theirsSet = new Set(theirs);
  const myBookedSet = new Set(myBooked);
  const theirBookedSet = new Set(theirBooked);
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
    const j = await res.json().catch(() => ({}));
    if (j.id) {
      setBetweenUsMap({
        ...betweenUsMap,
        [iso]: { requestId: j.id, slotStart: iso, direction: "outgoing", status: "pending" },
      });
    }
    router.refresh();
  }

  async function act(
    requestId: string,
    action: "accept" | "decline" | "cancel",
    iso: string,
  ) {
    setBusy(requestId);
    setError(null);
    const res = await fetch(`/api/requests/${requestId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Failed");
      return;
    }
    const next = { ...betweenUsMap };
    if (action === "accept") {
      const existing = next[iso];
      if (existing) next[iso] = { ...existing, status: "accepted" };
    } else {
      delete next[iso];
    }
    setBetweenUsMap(next);
    router.refresh();
  }

  const bufferMs = 30 * 60 * 1000;

  function classify(iso: string): SlotState | null {
    const slotMs = new Date(iso).getTime();
    if (slotMs < nowMs) return null;
    if (slotMs < nowMs + bufferMs) return "booked";
    const p = betweenUsMap[iso];
    if (p) {
      if (p.status === "accepted") return "confirmed";
      return p.direction === "outgoing" ? "pendingOutgoing" : "pendingIncoming";
    }
    if (myBookedSet.has(iso) || theirBookedSet.has(iso)) return "booked";
    if (mineSet.has(iso) && theirsSet.has(iso)) return "available";
    return "none";
  }

  function filterSlot(iso: string): boolean {
    const state = classify(iso);
    return state !== null && state !== "none";
  }

  const allSlots = Object.values(groups).flat();
  const totalAvailable = allSlots.filter((iso) => classify(iso) === "available").length;
  const totalBetweenUs = allSlots.filter((iso) => {
    const s = classify(iso);
    return s === "pendingOutgoing" || s === "pendingIncoming" || s === "confirmed";
  }).length;

  const base =
    "flex items-center gap-2 pl-3 pr-0 py-0 rounded-md border text-sm overflow-hidden min-h-[36px]";

  function renderSlot(iso: string, { isHighlighted }: { isHighlighted: boolean; isPast: boolean }) {
    const state = classify(iso);
    if (!state || state === "none") return null;
    const time = formatSlotTime(new Date(iso));
    const hlCls = isHighlighted
      ? "ring-2 ring-amber-400/60 border-amber-300 bg-amber-50/40"
      : "";

    if (state === "available") {
      return (
        <div
          key={iso}
          className={`${base} border-accent-200 bg-accent-50 hover:bg-accent-100 cursor-pointer ${hlCls}`}
          onClick={() => setConfirm(iso)}
        >
          <span className="text-xs text-accent-700 w-16 shrink-0 font-semibold">{time}</span>
          <div className="w-2 h-2 rounded-full bg-accent-500 shrink-0" />
          <span className="text-sm font-medium text-accent-700 truncate flex-1">Both free</span>
          <div className="flex self-stretch shrink-0 w-[72px] border-l border-accent-200">
            <button
              disabled={busy === iso}
              className="self-stretch flex-1 text-accent-600 text-xs font-semibold hover:bg-accent-200"
            >
              Request
            </button>
          </div>
        </div>
      );
    }

    if (state === "confirmed") {
      const p = betweenUsMap[iso]!;
      return (
        <div key={iso} className={`${base} border-emerald-200 bg-emerald-50 ${hlCls}`}>
          <span className="text-xs text-emerald-700 w-16 shrink-0 font-semibold">{time}</span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-sm font-medium text-emerald-900 truncate flex-1">
            Meeting with {toUserName}
          </span>
          <div className="flex self-stretch shrink-0 w-[72px] border-l border-emerald-200">
            <button
              onClick={() => {
                if (confirmingCancel === p.requestId) {
                  setConfirmingCancel(null);
                  act(p.requestId, "cancel", iso);
                } else {
                  setConfirmingCancel(p.requestId);
                }
              }}
              onBlur={() => {
                if (confirmingCancel === p.requestId) setConfirmingCancel(null);
              }}
              disabled={busy === p.requestId}
              className={`self-stretch flex-1 text-xs font-medium ${
                confirmingCancel === p.requestId
                  ? "text-stone-800 bg-stone-100 font-semibold"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-800"
              }`}
            >
              {confirmingCancel === p.requestId ? "Sure?" : "Cancel"}
            </button>
          </div>
        </div>
      );
    }

    if (state === "pendingOutgoing") {
      const p = betweenUsMap[iso]!;
      return (
        <div key={iso} className={`${base} border-amber-200 bg-amber-50 ${hlCls}`}>
          <span className="text-xs text-amber-700 w-16 shrink-0 font-semibold">{time}</span>
          <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span className="text-sm font-medium text-amber-800 truncate flex-1">Requested</span>
          <span className="text-[11px] text-amber-700/70 shrink-0 italic">waiting</span>
          <div className="flex self-stretch shrink-0 w-[72px] border-l border-amber-200">
            <button
              onClick={() => {
                if (confirmingCancel === p.requestId) {
                  setConfirmingCancel(null);
                  act(p.requestId, "cancel", iso);
                } else {
                  setConfirmingCancel(p.requestId);
                }
              }}
              onBlur={() => {
                if (confirmingCancel === p.requestId) setConfirmingCancel(null);
              }}
              disabled={busy === p.requestId}
              className={`self-stretch flex-1 text-xs font-medium ${
                confirmingCancel === p.requestId
                  ? "text-red-600 bg-red-50 font-semibold"
                  : "text-amber-700/80 hover:bg-amber-100 hover:text-red-600"
              }`}
            >
              {confirmingCancel === p.requestId ? "Sure?" : "Cancel"}
            </button>
          </div>
        </div>
      );
    }

    if (state === "pendingIncoming") {
      const p = betweenUsMap[iso]!;
      return (
        <div key={iso} className={`${base} border-amber-200 bg-amber-50 ${hlCls}`}>
          <span className="text-xs text-amber-700 w-16 shrink-0 font-semibold">{time}</span>
          <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span className="text-sm font-medium text-amber-900 truncate flex-1">
            {toUserName} requested
          </span>
          <div className="flex self-stretch shrink-0 w-[112px] border-l border-amber-200">
            <button
              onClick={() => act(p.requestId, "accept", iso)}
              disabled={busy === p.requestId}
              className="self-stretch flex-1 text-emerald-600 text-xs font-semibold hover:bg-emerald-50 disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={() => act(p.requestId, "decline", iso)}
              disabled={busy === p.requestId}
              className="self-stretch flex-1 border-l border-amber-200 text-stone-400 text-xs font-medium hover:bg-stone-50 hover:text-stone-600 disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={iso} className={`${base} border-stone-100 bg-stone-50 opacity-50 ${hlCls}`}>
        <span className="text-xs text-stone-400 w-16 shrink-0 font-medium">{time}</span>
        <span className="text-sm text-stone-400 truncate flex-1">Unavailable</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-xs text-stone-400 flex flex-wrap gap-4 pb-3 border-b border-stone-200/60">
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-accent-500 rounded" />
          both free
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-emerald-500 rounded" />
          confirmed
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-amber-500 rounded" />
          requested
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-stone-300 rounded" />
          unavailable
        </span>
        {highlightedSlots.length > 0 && (
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 ring-2 ring-amber-400 bg-amber-50 rounded" />
            designated 1:1 time
          </span>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      {totalAvailable === 0 && totalBetweenUs === 0 && (
        <div className="text-sm text-stone-500 bg-white rounded-md border border-stone-200 shadow-sm p-6 text-center">
          No overlapping availability right now.
          <br />
          <span className="text-xs text-stone-400">
            Check back later or update your schedule.
          </span>
        </div>
      )}

      <SlotGrid
        groups={groups}
        now={now}
        highlightedSlots={highlightedSlots}
        renderSlot={renderSlot}
        filterSlot={filterSlot}
        emptyDayMessage="No overlap"
      />

      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setConfirm(null)}
        >
          <div
            className="bg-white rounded-lg border border-stone-200 shadow-lg p-6 w-full max-w-sm mx-4"
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
              <span className="font-semibold text-stone-700">{formatSlotDay(new Date(confirm))}</span>{" "}
              at{" "}
              <span className="font-semibold text-stone-700">{formatSlotTime(new Date(confirm))}</span>?
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setConfirm(null)}
                className="px-4 py-2 text-sm font-medium border border-stone-200 rounded-md hover:bg-stone-50 text-stone-600"
              >
                Cancel
              </button>
              <button
                onClick={() => request(confirm)}
                disabled={busy === confirm}
                className="px-4 py-2 text-sm font-semibold bg-accent-500 text-white rounded-md hover:bg-accent-600 disabled:opacity-50"
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
