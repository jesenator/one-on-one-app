"use client";

import { useState } from "react";

export default function DeleteButton({ action }: { action: () => Promise<void> }) {
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={() => {
          if (!armed) {
            setArmed(true);
            return;
          }
          setPending(true);
          action();
        }}
        onBlur={() => {
          if (!pending) setArmed(false);
        }}
        disabled={pending}
        className={`inline-flex items-center gap-2 text-sm font-medium border rounded-md px-4 py-2 disabled:opacity-60 ${
          armed
            ? "text-white bg-red-600 border-red-600 hover:bg-red-700"
            : "text-red-500 border-red-200 hover:bg-red-50"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${armed ? "text-white" : "text-red-400"}`}>
          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
        </svg>
        {pending ? "Deleting…" : armed ? "Yes, delete my account" : "Delete account"}
      </button>
      {armed && !pending && (
        <p className="text-xs text-red-600">
          This cancels all your meetings and removes your data. Click again to confirm.
        </p>
      )}
    </div>
  );
}
