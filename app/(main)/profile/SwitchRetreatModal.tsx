"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type RetreatItem = {
  retreatId: string;
  name: string;
  isCurrent: boolean;
};

type Props = {
  retreats: RetreatItem[];
  action: (formData: FormData) => Promise<void>;
  open?: boolean;
  onClose?: () => void;
};

export default function SwitchRetreatModal({ retreats, action, open: controlledOpen, onClose }: Props) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;

  const close = () => {
    if (isControlled) onClose?.();
    else setInternalOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isControlled) onClose?.();
        else setInternalOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isControlled, onClose]);

  return (
    <>
      {!isControlled && (
        <button
          type="button"
          onClick={() => setInternalOpen(true)}
          className="text-sm text-stone-500 font-medium border border-stone-200 rounded-md px-4 py-2 hover:bg-stone-50"
        >
          Switch retreats
        </button>
      )}

      {open && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Switch retreats</h2>
                <p className="text-xs text-stone-400 mt-0.5">Choose which retreat to view</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="text-stone-400 hover:text-stone-600"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {retreats.map((r) => {
                if (r.isCurrent) {
                  return (
                    <div
                      key={r.retreatId}
                      className="flex items-center justify-between rounded-md border border-accent-200 bg-accent-50/40 px-4 py-3 text-sm font-medium text-accent-700"
                    >
                      <span>{r.name}</span>
                      <span className="text-xs text-accent-500">Current</span>
                    </div>
                  );
                }
                return (
                  <form key={r.retreatId} action={action}>
                    <input type="hidden" name="retreatId" value={r.retreatId} />
                    <button
                      type="submit"
                      className="w-full flex items-center justify-between rounded-md border border-stone-200 bg-stone-50/60 px-4 py-3 text-sm font-medium text-stone-700 hover:border-accent-300 hover:bg-accent-50 hover:text-accent-700"
                    >
                      <span>{r.name}</span>
                      <span className="text-xs text-stone-400">Switch</span>
                    </button>
                  </form>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
