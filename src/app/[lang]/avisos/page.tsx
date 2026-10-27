import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { formatRelative } from "@/i18n/format";
import { getSession } from "@/lib/auth/session";
import { listActivity } from "@/lib/social/queries";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { BottomNav } from "@/components/BottomNav";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).activity.title };
}

export default async function ActivityPage() {
  const locale = await getLocale();
  const t = await getDictionary();

  return (
    <>
      <AppHeader t={t} locale={locale} />
      <main id="conteudo" className="mx-auto max-w-2xl space-y-4 px-4 pb-28 pt-5">
        <h1 className="font-display text-3xl font-bold">{t.activity.title}</h1>
        <Suspense fallback={<p className="text-muted">{t.post.loading}</p>}>
          <ActivityList />
        </Suspense>
      </main>
      <BottomNav t={t.nav} locale={locale} current="notifications" />
    </>
  );
}

async function ActivityList() {
  await connection();
  const [locale, t, session] = await Promise.all([getLocale(), getDictionary(), getSession()]);

  if (!session) {
    return (
      <div className="space-y-3 rounded-2xl border border-line bg-surface p-5">
        <p>{t.activity.signInRequired}</p>
        <Link
          href={`/${locale}/entrar`}
          className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 font-semibold text-on-primary"
        >
          {t.activity.signIn}
        </Link>
      </div>
    );
  }

  const items = await listActivity(session.user.id);
  if (items.length === 0) return <p className="text-muted">{t.activity.empty}</p>;

  return (
    <ul className="divide-y divide-line">
      {items.map((item, index) => {
        const href = item.postId ? `/${locale}/p/${item.postId}` : `/${locale}/u/${item.who.handle}`;
        const action = item.kind === "like" ? t.activity.liked : item.kind === "comment" ? t.activity.commented : t.activity.followed;
        return (
          <li key={`${item.kind}-${item.at.toISOString()}-${index}`}>
            <Link href={href} className="flex min-h-14 items-start gap-3 py-3">
              <Avatar displayName={item.who.displayName} avatarUrl={item.who.avatarUrl} size={44} />
              <span className="min-w-0 flex-1 break-words">
                <span className="font-semibold">{item.who.displayName}</span> {action}
                {item.text && <span className="block text-muted">{item.text}</span>}
                <span className="block text-xs text-muted">{formatRelative(item.at, locale)}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
