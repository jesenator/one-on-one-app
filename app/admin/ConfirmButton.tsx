"use client";

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
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children ?? label}
    </button>
  );
}
