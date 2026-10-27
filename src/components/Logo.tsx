import { brand } from "@/config/brand.config";

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático da marca */}
      <img src={brand.logo} alt="" width={size} height={size} />
      <span className="font-display text-lg font-bold tracking-tight">{brand.name}</span>
    </span>
  );
}
