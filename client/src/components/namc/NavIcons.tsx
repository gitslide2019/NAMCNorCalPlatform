// Custom SVG nav icons for the NAMC bottom tab bar.
// Distinct silhouettes from default lucide so the navigation reads as branded.

type IconProps = React.SVGProps<SVGSVGElement> & { active?: boolean };

const baseProps = (active?: boolean) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: active ? 2.25 : 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function HardHatIcon({ active, ...rest }: IconProps) {
  return (
    <svg {...baseProps(active)} {...rest}>
      <path d="M3 17h18M5 17v-2a7 7 0 0 1 14 0v2" />
      <path d="M9 17v-7m6 7v-7" />
      <path d="M11 6h2v3h-2z" />
    </svg>
  );
}

export function BlueprintIcon({ active, ...rest }: IconProps) {
  return (
    <svg {...baseProps(active)} {...rest}>
      <rect x="3" y="3" width="18" height="18" rx="1.5" />
      <path d="M3 9h18M9 3v18" />
      <path d="M14 13h3v3h-3z" />
    </svg>
  );
}

export function CalendarFlagIcon({ active, ...rest }: IconProps) {
  return (
    <svg {...baseProps(active)} {...rest}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M14 14l3 1.5-3 1.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ChatCornerIcon({ active, ...rest }: IconProps) {
  return (
    <svg {...baseProps(active)} {...rest}>
      <path d="M4 5h16v11H8l-4 4z" />
      <path d="M8 10h8M8 13h5" />
    </svg>
  );
}

export function StackedDotsIcon({ active, ...rest }: IconProps) {
  return (
    <svg {...baseProps(active)} {...rest}>
      <circle cx="6" cy="6" r="1.5" fill="currentColor" />
      <circle cx="12" cy="6" r="1.5" fill="currentColor" />
      <circle cx="18" cy="6" r="1.5" fill="currentColor" />
      <circle cx="6" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" />
      <circle cx="6" cy="18" r="1.5" fill="currentColor" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" />
      <circle cx="18" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function NamcMonogram({ className }: { className?: string }) {
  // Stylized "N" in a circle — the FAB content
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
        fontWeight="800"
        fontSize="20"
        fill="currentColor"
        style={{ letterSpacing: "-0.06em" }}
      >
        N
      </text>
    </svg>
  );
}
