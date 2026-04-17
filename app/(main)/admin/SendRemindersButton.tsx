"use client";

import { useActionState, useState } from "react";

type PendingUser = { name: string; email: string; count: number };

export default function SendRemindersButton({
  action,
  pendingUsers,
  retreatId,
  retreatName,
}: {
  action: (prev: string | null, formData: FormData) => Promise<string>;
  pendingUsers: PendingUser[];
  retreatId: string;
  retreatName: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [result, formAction, isPending] = useActionState(action, null);

  if (pendingUsers.length === 0) return null;

  return (
    <>
      {result ? (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
          </svg>
          {result}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="text-sm font-medium text-accent-600 border border-accent-200 rounded-md px-3 py-1.5 hover:bg-accent-50"
        >
          Remind pending ({pendingUsers.length} {pendingUsers.length === 1 ? "person" : "people"})
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => !isPending && setShowModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl border border-stone-200 w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            <div className="px-5 py-4 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-800">
                Send pending reminders
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                The following {pendingUsers.length} {pendingUsers.length === 1 ? "person" : "people"} will receive an email about their pending one-on-ones:
              </p>
            </div>

            <div className="overflow-y-auto divide-y divide-stone-100 flex-1">
              {pendingUsers.map((u) => (
                <div key={u.email} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium text-stone-800">{u.name}</div>
                    <div className="text-xs text-stone-400">{u.email}</div>
                  </div>
                  <span className="text-xs font-bold bg-amber-100 text-amber-700 rounded-full px-2.5 py-0.5">
                    {u.count} pending
                  </span>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isPending}
                className="text-sm font-medium text-stone-500 border border-stone-200 rounded-md px-3 py-1.5 hover:bg-stone-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <form action={formAction}>
                <input type="hidden" name="retreatId" value={retreatId} />
                <input type="hidden" name="retreatName" value={retreatName} />
                <button
                  type="submit"
                  disabled={isPending}
                  className="text-sm font-medium text-white bg-accent-500 rounded-md px-3 py-1.5 hover:bg-accent-600 disabled:opacity-50"
                >
                  {isPending ? "Sending..." : "Send reminders"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
