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
    <section className="overflow-hidden rounded-3xl bg-linear-to-br from-hero-from via-hero-via to-hero-to text-on-hero">
      <div className="space-y-4 p-6 sm:p-8">
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
        <p className="text-lg opacity-90">{lead}</p>
        <Link
          href={href}
          className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-semibold text-on-primary shadow-sm"
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
        <svg viewBox="0 0 400 110" aria-hidden="true" className="block w-full">
          <circle cx="92" cy="70" r="52" fill="var(--brand-primary)" opacity="0.85" />
          <circle cx="200" cy="52" r="52" fill="var(--brand-accent)" opacity="0.9" />
          <circle cx="308" cy="70" r="52" fill="var(--brand-stripe-blue)" opacity="0.85" />
          <path d="M40 92q40-34 80 0t80 0t80 0t80 0" fill="none" stroke="var(--brand-surface)" strokeWidth="8" strokeLinecap="round" opacity="0.9" />
        </svg>
      )}
    </section>
  );
}
