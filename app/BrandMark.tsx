type Size = "sm" | "lg";

const SIZES: Record<Size, string> = {
  sm: "w-8 h-8",
  lg: "w-12 h-12",
};

export default function BrandMark({ size = "sm" }: { size?: Size }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`shrink-0 ${SIZES[size]}`}
    >
      <rect x="0" y="0" width="100" height="100" rx="22" fill="#009BA3" />
      <g>
        <rect x="14" y="22" width="72" height="64" rx="9" fill="none" stroke="#ffffff" strokeWidth="5" />
        <line x1="14" y1="36" x2="86" y2="36" stroke="#ffffff" strokeWidth="5" />
        <line x1="28" y1="15" x2="28" y2="29" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <line x1="72" y1="15" x2="72" y2="29" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
      </g>
      <circle cx="42" cy="62" r="14" fill="#000000" />
      <circle cx="58" cy="62" r="14" fill="#ffffff" />
      <circle cx="42" cy="62" r="14" fill="none" stroke="#000000" strokeWidth="1.2" />
    </svg>
  );
}
