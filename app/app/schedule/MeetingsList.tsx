"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { formatSlotDay, formatSlotTime } from "@/lib/format";

type Person = { id: string; name: string; email: string };
type R = {
  id: string;
  slotStart: string;
  status: string;
  fromUserId: string;
  toUserId: string;
  from: Person;
  to: Person;
};

export default function MeetingsList({
  incoming,
  outgoing,
  confirmed,
  meId,
}: {
  incoming: R[];
  outgoing: R[];
  confirmed: R[];
  meId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function act(id: string, action: "accept" | "decline" | "cancel") {
    const res = await fetch(`/api/requests/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Failed");
      return;
    }
    startTransition(() => router.refresh());
  }

  const fmt = (iso: string) =>
    `${formatSlotDay(new Date(iso))} ${formatSlotTime(new Date(iso))}`;

  const hasAny = confirmed.length > 0 || incoming.length > 0 || outgoing.length > 0;

  if (!hasAny) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
        <p className="text-sm text-zinc-500">
          No meetings yet. Browse <a href="/app/attendees" className="underline text-zinc-700">attendees</a> to request 1:1s.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {confirmed.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Confirmed ({confirmed.length})
            </h3>
            <a
              href="/api/meetings/ics"
              className="text-xs px-2.5 py-1 bg-zinc-900 text-white rounded-md font-medium hover:bg-zinc-800 transition"
            >
              Download all .ics
            </a>
          </div>
          <div className="space-y-1.5">
            {confirmed.map((r) => {
              const other = r.fromUserId === meId ? r.to : r.from;
              return (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium">{other.name}</span>
                      <span className="text-xs text-zinc-500 ml-2">{fmt(r.slotStart)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <a
                      href={`/api/meetings/${r.id}/ics`}
                      className="px-2 py-1 border border-zinc-200 text-zinc-600 rounded text-xs hover:bg-zinc-50 transition"
                    >
                      .ics
                    </a>
                    <button
                      onClick={() => { if (window.confirm("Cancel this 1:1?")) act(r.id, "cancel"); }}
                      className="px-2 py-1 border border-red-200 text-red-600 rounded text-xs hover:bg-red-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {incoming.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
            Incoming ({incoming.length})
          </h3>
          <div className="space-y-1.5">
            {incoming.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium">{r.from.name}</span>
                    <span className="text-xs text-zinc-500 ml-2">{fmt(r.slotStart)}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => act(r.id, "accept")}
                    className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => act(r.id, "decline")}
                    className="px-2 py-1 border border-zinc-200 text-zinc-600 rounded text-xs hover:bg-zinc-50 transition"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {outgoing.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
            Awaiting response ({outgoing.length})
          </h3>
          <div className="space-y-1.5">
            {outgoing.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-zinc-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium">{r.to.name}</span>
                    <span className="text-xs text-zinc-500 ml-2">{fmt(r.slotStart)}</span>
                  </div>
                </div>
                <button
                  onClick={() => { if (window.confirm("Cancel this request?")) act(r.id, "cancel"); }}
                  className="px-2 py-1 border border-zinc-200 text-zinc-600 rounded text-xs hover:bg-zinc-50 transition shrink-0"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
