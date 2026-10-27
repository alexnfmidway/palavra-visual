// Ícones de traço simples (24x24), herdam a cor do texto. Decorativos: o texto ao lado dá o nome.
type IconProps = { filled?: boolean; className?: string };

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function HomeIcon({ filled, className }: IconProps) {
  return (
    <svg {...base} className={className} fill={filled ? "currentColor" : "none"}>
      <path d="M3.5 10.8 12 3.5l8.5 7.3V20a1 1 0 0 1-1 1H15v-6h-6v6H4.5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

export function SearchIcon({ filled, className }: IconProps) {
  return (
    <svg {...base} className={className} strokeWidth={filled ? 2.8 : 1.9}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeWidth={2.6}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function HeartIcon({ filled, className }: IconProps) {
  return (
    <svg {...base} className={className} fill={filled ? "currentColor" : "none"}>
      <path d="M12 20.5s-7.5-4.6-9-9.6C2 7.5 4 4.5 7.2 4.5c1.9 0 3.6 1 4.8 2.7 1.2-1.7 2.9-2.7 4.8-2.7 3.2 0 5.2 3 4.2 6.4-1.5 5-9 9.6-9 9.6z" />
    </svg>
  );
}

export function CommentIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20.5 11.5a8 8 0 0 1-11.8 7L3.5 20l1.5-4.6a8 8 0 1 1 15.5-3.9z" />
    </svg>
  );
}

export function UserIcon({ filled, className }: IconProps) {
  return (
    <svg {...base} className={className} fill={filled ? "currentColor" : "none"}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5" />
    </svg>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} fill="currentColor" stroke="none">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

export function LayersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="8" y="3.5" width="12.5" height="12.5" rx="2.5" />
      <path d="M5.5 8A2.5 2.5 0 0 0 3.5 10.5V18A2.5 2.5 0 0 0 6 20.5h7.5" />
    </svg>
  );
}
