import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { BottomNav } from "@/components/BottomNav";
import { Composer } from "@/components/Composer";
import { Logo } from "@/components/Logo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).create.title };
}

export default async function CreatePage() {
  const locale = await getLocale();
  const t = await getDictionary();

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href={`/${locale}`} aria-label={t.post.back}>
            <Logo />
          </Link>
        </div>
      </header>

      <main id="conteudo" className="mx-auto max-w-2xl space-y-6 px-4 pb-28 pt-6">
        <h1 className="font-display text-3xl font-bold">{t.create.title}</h1>
        <Composer t={t.create} tPost={t.post} locale={locale} />
      </main>

      <BottomNav t={t.nav} locale={locale} current="create" />
    </>
  );
}
