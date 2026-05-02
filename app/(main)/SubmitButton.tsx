"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

// Submit button with feedback for server-action forms.
// - Spinner + disabled while pending.
// - Brief checkmark after the action returns (only visible if the page didn't redirect).
// Use inside a <form action={serverAction}>.
export default function SubmitButton({
  children,
  pendingChildren,
  successChildren = "Saved",
  className = "bg-accent-500 text-white rounded-md px-5 py-2.5 text-sm font-semibold hover:bg-accent-600 disabled:opacity-60",
  successDurationMs = 1500,
  showSuccess = true,
  onClickGuard,
}: {
  children: React.ReactNode;
  pendingChildren?: React.ReactNode;
  successChildren?: React.ReactNode;
  className?: string;
  successDurationMs?: number;
  showSuccess?: boolean;
  // Optional guard run on click. Return false (or don't call resolve(true)) to prevent submission.
  onClickGuard?: (e: React.MouseEvent<HTMLButtonElement>) => boolean | void;
}) {
  const { pending } = useFormStatus();
  const [justFinished, setJustFinished] = useState(false);
  const wasPendingRef = useRef(false);

  useEffect(() => {
    if (pending) {
      wasPendingRef.current = true;
      return;
    }
    if (wasPendingRef.current && showSuccess) {
      wasPendingRef.current = false;
      // Defer to next tick to avoid a synchronous cascading render in the same effect.
      const showT = setTimeout(() => setJustFinished(true), 0);
      const hideT = setTimeout(() => setJustFinished(false), successDurationMs);
      return () => {
        clearTimeout(showT);
        clearTimeout(hideT);
      };
    }
  }, [pending, showSuccess, successDurationMs]);

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (onClickGuard) {
          const result = onClickGuard(e);
          if (result === false) e.preventDefault();
        }
      }}
      className={`inline-flex items-center justify-center gap-1.5 ${className}`}
    >
      {pending ? (
        <>
          <Spinner />
          <span>{pendingChildren ?? children}</span>
        </>
      ) : justFinished ? (
        <>
          <CheckIcon />
          <span>{successChildren}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className="w-4 h-4 animate-spin"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.296a1 1 0 0 1 0 1.408l-7.5 7.5a1 1 0 0 1-1.408 0l-3.5-3.5a1 1 0 0 1 1.408-1.408L8.5 12.092l6.796-6.796a1 1 0 0 1 1.408 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
