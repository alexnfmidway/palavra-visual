import { Suspense } from "react";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { BottomNav } from "@/components/BottomNav";
import { RecentPosts } from "@/components/RecentPosts";
import { HeaderAccount } from "@/components/HeaderAccount";
import { InterestPicker } from "@/components/InterestPicker";
import { Logo } from "@/components/Logo";
import { Hero } from "@/components/Hero";

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getDictionary();

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="h-1 bg-linear-to-r from-primary via-accent to-stripe-blue" aria-hidden="true" />
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Logo />
          <HeaderAccount t={t.auth} locale={locale} />
        </div>
      </header>

      <main id="conteudo" className="mx-auto max-w-2xl space-y-8 px-4 pb-28 pt-8">
        <Hero title={t.home.title} lead={t.home.lead} cta={t.home.cta} href={`/${locale}/criar`} />

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
