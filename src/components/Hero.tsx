import Link from "next/link";
import { showcasePhotos } from "@/config/showcase";

type Props = {
  title: string;
  lead: string;
  cta: string;
  href: string;
};

export function Hero({ title, lead, cta, href }: Props) {
  const photos = showcasePhotos.slice(0, 4);

  return (
    <section className="overflow-hidden rounded-3xl bg-hero text-on-hero">
      <div className="space-y-4 p-6 sm:p-8">
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
        <p className="text-lg opacity-95">{lead}</p>
        <Link
          href={href}
          className="inline-flex min-h-12 items-center rounded-full bg-accent px-6 font-semibold text-on-accent"
        >
          {cta}
        </Link>
      </div>

      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-1 p-1 pt-0">
          {photos.map((photo, index) => (
            <li key={photo.src} className={index === 0 && photos.length % 2 === 1 ? "col-span-2" : ""}>
              {/* eslint-disable-next-line @next/next/no-img-element -- fotos estáticas da vitrine */}
              <img
                src={photo.src}
                alt={photo.alt}
                loading={index === 0 ? "eager" : "lazy"}
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
            </li>
          ))}
        </ul>
      ) : (
        <svg viewBox="0 0 400 120" aria-hidden="true" className="block w-full">
          <rect width="400" height="120" fill="var(--brand-flag-blue)" />
          <path d="M200 8 372 60 200 112 28 60Z" fill="var(--brand-accent)" />
          <circle cx="200" cy="60" r="38" fill="var(--brand-flag-blue)" />
          <path d="M166 62q17-20 34 0t34 0" fill="none" stroke="var(--brand-surface)" strokeWidth="7" strokeLinecap="round" />
        </svg>
      )}
    </section>
  );
}
