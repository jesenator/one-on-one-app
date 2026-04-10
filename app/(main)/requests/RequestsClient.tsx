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

export default function RequestsClient({
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
  const [, startTransition] = useTransition();

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

  const fmtTime = (iso: string) =>
    `${formatSlotDay(new Date(iso))} ${formatSlotTime(new Date(iso))}`;

  return (
    <div className="space-y-8">
      <Section title="Incoming" count={incoming.length}>
        {incoming.length === 0 && <Empty>No pending requests.</Empty>}
        {incoming.map((r) => (
          <Row key={r.id}>
            <div>
              <div className="font-medium text-sm">{r.from.name}</div>
              <div className="text-xs text-zinc-500">{fmtTime(r.slotStart)}</div>
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700 transition"
                onClick={() => act(r.id, "accept")}
              >
                Accept
              </button>
              <button
                className="px-3 py-1.5 border border-zinc-200 text-zinc-600 rounded-md text-xs font-medium hover:bg-zinc-50 transition"
                onClick={() => act(r.id, "decline")}
              >
                Decline
              </button>
            </div>
          </Row>
        ))}
      </Section>

      <Section title="Outgoing" count={outgoing.length}>
        {outgoing.length === 0 && <Empty>No outgoing requests.</Empty>}
        {outgoing.map((r) => (
          <Row key={r.id}>
            <div>
              <div className="font-medium text-sm">{r.to.name}</div>
              <div className="text-xs text-zinc-500">{fmtTime(r.slotStart)}</div>
            </div>
            <button
              className="px-3 py-1.5 border border-zinc-200 text-zinc-600 rounded-md text-xs font-medium hover:bg-zinc-50 transition"
              onClick={() => act(r.id, "cancel")}
            >
              Cancel
            </button>
          </Row>
        ))}
      </Section>

      <Section
        title="Confirmed"
        count={confirmed.length}
        action={
          confirmed.length > 0 && (
            <a
              href="/api/meetings/ics"
              className="text-xs px-3 py-1.5 bg-zinc-900 text-white rounded-md font-medium hover:bg-zinc-800 transition"
            >
              Download all .ics
            </a>
          )
        }
      >
        {confirmed.length === 0 && <Empty>No confirmed 1:1s yet.</Empty>}
        {confirmed.map((r) => {
          const other = r.fromUserId === meId ? r.to : r.from;
          return (
            <Row key={r.id}>
              <div>
                <div className="font-medium text-sm">{other.name}</div>
                <div className="text-xs text-zinc-500">
                  {fmtTime(r.slotStart)}
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/api/meetings/${r.id}/ics`}
                  className="px-3 py-1.5 border border-zinc-200 text-zinc-600 rounded-md text-xs font-medium hover:bg-zinc-50 transition"
                >
                  .ics
                </a>
                <button
                  className="px-3 py-1.5 border border-red-200 text-red-600 rounded-md text-xs font-medium hover:bg-red-50 transition"
                  onClick={() => {
                    if (confirm("Cancel this 1:1?")) act(r.id, "cancel");
                  }}
                >
                  Cancel
                </button>
              </div>
            </Row>
          );
        })}
      </Section>
    </div>
  );
}

function Section({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-700">{title}</h2>
          {count !== undefined && (
            <span className="text-xs bg-zinc-200 text-zinc-600 rounded-full px-2 py-0.5">
              {count}
            </span>
          )}
        </div>
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 flex items-center justify-between">
      {children}
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-zinc-500">{children}</p>;
}
