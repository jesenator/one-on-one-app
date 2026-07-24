"use client";

import { useState } from "react";

// Two-click confirm: first click arms the button, second click submits the
// form. Native window.confirm is banned in this codebase (silently suppressed
// in prod — see CalendarView's cancel button for the original fix).
export default function ConfirmButton({
  message,
  label,
  className,
  children,
}: {
  message: string;
  label: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      type="submit"
      className={className}
      title={message}
      onClick={(e) => {
        if (!armed) {
          e.preventDefault();
          setArmed(true);
        }
      }}
      onBlur={() => setArmed(false)}
    >
      {armed ? "Sure?" : children ?? label}
    </button>
  );
}
