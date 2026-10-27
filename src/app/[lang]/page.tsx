import { Suspense } from "react";
import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { BottomNav } from "@/components/BottomNav";
import { RecentPosts } from "@/components/RecentPosts";
import { HeaderAccount } from "@/components/HeaderAccount";
import { InterestPicker } from "@/components/InterestPicker";
import { Logo } from "@/components/Logo";

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getDictionary();

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Logo />
          <HeaderAccount t={t.auth} locale={locale} />
        </div>
      </header>

      <main id="conteudo" className="mx-auto max-w-2xl space-y-8 px-4 pb-28 pt-8">
        <section className="space-y-3">
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{t.home.title}</h1>
          <p className="text-lg text-muted">{t.home.lead}</p>
          <Link
            href={`/${locale}/criar`}
            className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-semibold text-on-primary"
          >
            {t.home.cta}
          </Link>
        </section>

        <section aria-labelledby="recentes" className="space-y-3">
          <h2 id="recentes" className="font-display text-xl font-bold">
            {t.post.recent}
          </h2>
          <Suspense fallback={<p className="text-muted">{t.post.loading}</p>}>
            <RecentPosts />
          </Suspense>
        </section>

        <section aria-labelledby="interesses" className="space-y-3">
          <h2 id="interesses" className="font-display text-xl font-bold">
            {t.home.interestsTitle}
          </h2>
          <p className="text-sm text-muted">{t.home.interestsHint}</p>
          <InterestPicker interests={t.home.interests} />
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-display text-xl font-bold">{t.home.placeCardTitle}</h2>
          <p className="mt-2 text-muted">{t.home.placeCardBody}</p>
        </section>
      </main>

      <BottomNav t={t.nav} locale={locale} current="home" />
    </>
  );
}
