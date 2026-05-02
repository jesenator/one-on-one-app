export default function Section({
  title,
  subtitle,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-md border border-stone-200 bg-white shadow-sm overflow-hidden">
      <summary className="cursor-pointer select-none list-none px-4 py-3 flex items-center gap-2 hover:bg-stone-50">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-stone-400 transition-transform group-open:rotate-90 shrink-0">
          <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
        <h2 className="text-sm font-bold text-stone-700">{title}</h2>
        {typeof count === "number" && (
          <span className="text-xs font-semibold text-stone-400 tabular-nums">({count})</span>
        )}
        {subtitle && <span className="text-xs text-stone-400 ml-1">{subtitle}</span>}
      </summary>
      <div className="border-t border-stone-100 p-4">{children}</div>
    </details>
  );
}
