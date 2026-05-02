"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Attendee = { id: string; name: string; email: string };

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

export default function AdminScheduleMeeting({
  retreatId,
  attendees,
  slotGroups,
  availabilityByUser,
  busyByUser,
  highlightedSlots,
}: {
  retreatId: string;
  attendees: Attendee[];
  slotGroups: Record<string, string[]>;
  availabilityByUser: Record<string, string[]>;
  busyByUser: Record<string, string[]>;
  highlightedSlots: string[];
}) {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [slot, setSlot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const fromAvail = useMemo(() => new Set(availabilityByUser[fromId] || []), [availabilityByUser, fromId]);
  const toAvail = useMemo(() => new Set(availabilityByUser[toId] || []), [availabilityByUser, toId]);
  const fromBusy = useMemo(() => new Set(busyByUser[fromId] || []), [busyByUser, fromId]);
  const toBusy = useMemo(() => new Set(busyByUser[toId] || []), [busyByUser, toId]);
  const highlighted = useMemo(() => new Set(highlightedSlots), [highlightedSlots]);

  const days = Object.keys(slotGroups).sort();
  const samePerson = fromId && toId && fromId === toId;
  const ready = fromId && toId && slot && !samePerson;

  const fromName = attendees.find((a) => a.id === fromId)?.name || "Person A";
  const toName = attendees.find((a) => a.id === toId)?.name || "Person B";

  function slotState(iso: string): "ok" | "warn" | "busy" {
    if (!fromId || !toId) return "ok";
    if (fromBusy.has(iso) || toBusy.has(iso)) return "busy";
    if (!fromAvail.has(iso) || !toAvail.has(iso)) return "warn";
    return "ok";
  }

  async function submit() {
    setError(null);
    setSuccess(null);
    if (!fromId || !toId || !slot) return;
    if (fromId === toId) {
      setError("Pick two different people.");
      return;
    }
    const state = slotState(slot);
    if (state === "busy") {
      setError("One or both people already have a meeting at that time.");
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/admin/${retreatId}/schedule`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fromUserId: fromId, toUserId: toId, slotStart: slot }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Failed to schedule.");
        return;
      }
      setSuccess(`Scheduled ${fromName} ↔ ${toName}.`);
      setSlot("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">Person A</label>
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
          >
            <option value="">Select…</option>
            {attendees.map((a) => (
              <option key={a.id} value={a.id} disabled={a.id === toId}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">Person B</label>
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
          >
            <option value="">Select…</option>
            {attendees.map((a) => (
              <option key={a.id} value={a.id} disabled={a.id === fromId}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {samePerson && (
        <div className="text-xs text-red-600">Pick two different people.</div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
          <label className="block text-xs font-semibold text-stone-600">Slot</label>
          <div className="flex items-center gap-2 text-[10px] text-stone-400 flex-wrap">
            {fromId && toId && !samePerson && (
              <>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> both free</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-stone-300 inline-block" /> one not avail</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-300 inline-block" /> conflict</span>
              </>
            )}
            {highlightedSlots.length > 0 && (
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full ring-2 ring-amber-400 inline-block" /> highlighted</span>
            )}
          </div>
        </div>
        <div className="space-y-1.5 max-h-72 overflow-y-auto rounded-md border border-stone-200 p-2 bg-stone-50/40">
          {days.map((day) => (
            <div key={day} className="flex items-start gap-2">
              <span className="text-[11px] font-semibold text-stone-500 w-16 shrink-0 pt-1">{fmtDay(day)}</span>
              <div className="flex flex-wrap gap-1">
                {slotGroups[day].map((iso) => {
                  const state = slotState(iso);
                  const selected = slot === iso;
                  const isHighlighted = highlighted.has(iso);
                  const base = "px-2 py-0.5 rounded-full text-[11px] font-medium border transition";
                  let cls: string;
                  if (selected) {
                    cls = "bg-accent-500 border-accent-600 text-white";
                  } else if (state === "busy") {
                    cls = "bg-red-50 border-red-200 text-red-400 line-through";
                  } else if (state === "warn") {
                    cls = "bg-stone-100 border-stone-200 text-stone-400 italic hover:border-stone-300 hover:text-stone-500";
                  } else if (fromId && toId) {
                    cls = "bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100";
                  } else {
                    cls = "bg-white border-stone-200 text-stone-600 hover:border-accent-300 hover:text-accent-700";
                  }
                  const hlCls = isHighlighted && !selected ? " ring-2 ring-amber-400/60 ring-offset-1 ring-offset-stone-50" : "";
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setSlot(iso)}
                      className={`${base} ${cls}${hlCls}`}
                      title={
                        (state === "busy"
                          ? "Conflict — one or both already booked"
                          : state === "warn"
                            ? "One or both haven't marked this available"
                            : fromId && toId
                              ? "Both available"
                              : "Slot") + (isHighlighted ? " (highlighted)" : "")
                      }
                    >
                      {fmtTime(iso)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {ready && slotState(slot) === "warn" && (
        <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          {`Heads up — ${fromName} or ${toName} hasn’t marked this slot as available. The meeting will still be created.`}
        </div>
      )}
      {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
      {success && <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">{success}</div>}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={!ready || isPending || slotState(slot) === "busy"}
          onClick={submit}
          className="bg-accent-500 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Scheduling…" : ready && slotState(slot) === "warn" ? "Schedule anyway" : "Schedule meeting"}
        </button>
      </div>
    </div>
  );
}
