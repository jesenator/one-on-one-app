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
    <div className="space-y-6">
      <Section title="Incoming">
        {incoming.length === 0 && <Empty>No pending requests.</Empty>}
        {incoming.map((r) => (
          <Row key={r.id}>
            <div>
              <div className="font-medium text-sm">{r.from.name}</div>
              <div className="text-xs text-gray-500">{fmtTime(r.slotStart)}</div>
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 bg-green-600 text-white rounded text-xs"
                onClick={() => act(r.id, "accept")}
              >
                Accept
              </button>
              <button
                className="px-3 py-1 bg-gray-200 rounded text-xs"
                onClick={() => act(r.id, "decline")}
              >
                Decline
              </button>
            </div>
          </Row>
        ))}
      </Section>

      <Section title="Outgoing">
        {outgoing.length === 0 && <Empty>No outgoing requests.</Empty>}
        {outgoing.map((r) => (
          <Row key={r.id}>
            <div>
              <div className="font-medium text-sm">{r.to.name}</div>
              <div className="text-xs text-gray-500">{fmtTime(r.slotStart)}</div>
            </div>
            <button
              className="px-3 py-1 bg-gray-200 rounded text-xs"
              onClick={() => act(r.id, "cancel")}
            >
              Cancel
            </button>
          </Row>
        ))}
      </Section>

      <Section
        title="Confirmed"
        action={
          confirmed.length > 0 && (
            <a
              href="/api/meetings/ics"
              className="text-xs px-2 py-1 bg-black text-white rounded"
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
                <div className="text-xs text-gray-500">
                  {fmtTime(r.slotStart)}
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/api/meetings/${r.id}/ics`}
                  className="px-3 py-1 bg-gray-200 rounded text-xs"
                >
                  .ics
                </a>
                <button
                  className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs"
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
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-lg p-3 flex items-center justify-between">
      {children}
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-500">{children}</p>;
}
