import { Suspense } from "react";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { HomeFeed } from "@/components/HomeFeed";

export default async function HomePage({ searchParams }: PageProps<"/[lang]">) {
  const locale = await getLocale();
  const t = await getDictionary();

  return (
    <>
      <AppHeader t={t} locale={locale} />

      <main id="conteudo" className="mx-auto max-w-2xl px-4 pb-28 pt-5">
        <Suspense fallback={<p className="text-muted">{t.post.loading}</p>}>
          <HomeFeed searchParams={searchParams} />
        </Suspense>
      </main>

      <BottomNav t={t.nav} locale={locale} current="home" />
    </>
  );
}
