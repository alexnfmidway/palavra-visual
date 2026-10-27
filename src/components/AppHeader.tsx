import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { HeaderAccount } from "./HeaderAccount";
import { Logo } from "./Logo";

/** Faixa tricolor + logo + conta. Igual em todas as telas do app. */
export function AppHeader({ t, locale }: { t: Dictionary; locale: Locale }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface">
      <div className="h-1 bg-linear-to-r from-primary via-accent to-stripe-blue" aria-hidden="true" />
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2">
        <Link href={`/${locale}`} aria-label={t.post.back}>
          <Logo />
        </Link>
        <HeaderAccount t={t.auth} locale={locale} />
      </div>
    </header>
  );
}
