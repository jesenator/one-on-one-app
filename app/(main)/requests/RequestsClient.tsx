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
      <Section
        title="Incoming"
        count={incoming.length}
        color="amber"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
          </svg>
        }
      >
        {incoming.length === 0 && <Empty>No pending requests.</Empty>}
        {incoming.map((r) => (
          <Row key={r.id} accent="amber">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-stone-900">{r.from.name}</div>
              <div className="text-xs text-stone-400">{fmtTime(r.slotStart)}</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-semibold hover:bg-emerald-700"
                onClick={() => act(r.id, "accept")}
              >
                Accept
              </button>
              <button
                className="px-3 py-1.5 border border-stone-200 text-stone-500 rounded-md text-xs font-medium hover:bg-stone-50"
                onClick={() => act(r.id, "decline")}
              >
                Decline
              </button>
            </div>
          </Row>
        ))}
      </Section>

      <Section
        title="Outgoing"
        count={outgoing.length}
        color="stone"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z" clipRule="evenodd" />
          </svg>
        }
      >
        {outgoing.length === 0 && <Empty>No outgoing requests.</Empty>}
        {outgoing.map((r) => (
          <Row key={r.id}>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-stone-900">{r.to.name}</div>
              <div className="text-xs text-stone-400">{fmtTime(r.slotStart)}</div>
            </div>
            <button
              className="px-3 py-1.5 border border-stone-200 text-stone-500 rounded-md text-xs font-medium hover:bg-stone-50 shrink-0"
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
        color="emerald"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
          </svg>
        }
        action={
          confirmed.length > 0 && (
            <a
              href="/api/meetings/ics"
              className="text-xs px-3 py-1.5 bg-accent-500 text-white rounded-md font-semibold hover:bg-accent-600 inline-flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
              </svg>
              Download all
            </a>
          )
        }
      >
        {confirmed.length === 0 && <Empty>No confirmed 1:1s yet.</Empty>}
        {confirmed.map((r) => {
          const other = r.fromUserId === meId ? r.to : r.from;
          return (
            <Row key={r.id} accent="emerald">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-stone-900">{other.name}</div>
                <div className="text-xs text-stone-400">
                  {fmtTime(r.slotStart)}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <a
                  href={`/api/meetings/${r.id}/ics`}
                  className="px-3 py-1.5 border border-stone-200 text-stone-500 rounded-md text-xs font-medium hover:bg-stone-50 inline-flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                    <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                  </svg>
                  .ics
                </a>
                <button
                  className="px-3 py-1.5 border border-red-200 text-red-500 rounded-md text-xs font-medium hover:bg-red-50"
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
  color = "stone",
  icon,
  action,
  children,
}: {
  title: string;
  count?: number;
  color?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const badgeColors: Record<string, string> = {
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
    stone: "bg-stone-100 text-stone-600",
  };
  const iconColors: Record<string, string> = {
    amber: "text-amber-500",
    emerald: "text-emerald-500",
    stone: "text-stone-400",
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={iconColors[color] || iconColors.stone}>{icon}</span>
          <h2 className="text-sm font-bold text-stone-700">{title}</h2>
          {count !== undefined && (
            <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${badgeColors[color] || badgeColors.stone}`}>
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

function Row({ children, accent }: { children: React.ReactNode; accent?: string }) {
  const borderLeft = accent === "emerald"
    ? "border-l-emerald-400"
    : accent === "amber"
    ? "border-l-amber-400"
    : "border-l-transparent";
  return (
    <div className={`overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm p-4 flex items-center justify-between gap-3 border-l-[3px] ${borderLeft}`}>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-stone-400 py-2">{children}</p>;
}
