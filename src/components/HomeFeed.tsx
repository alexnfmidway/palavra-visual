import Link from "next/link";
import { connection } from "next/server";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { formatMessage } from "@/i18n/format";
import { getSession } from "@/lib/auth/session";
import { listFeed, suggestPeople } from "@/lib/social/queries";
import { Avatar } from "./Avatar";
import { FeedPosts } from "./FeedPosts";
import { FollowButton } from "./FollowButton";
import { Hero } from "./Hero";
import { InterestPicker } from "./InterestPicker";

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

/** Início: visitantes veem a vitrine; quem entrou vê o feed com abas "Para você" e "Seguindo". */
export async function HomeFeed({ searchParams }: Props) {
  // Depende da sessão e do banco: só é montado quando alguém abre a página.
  await connection();
  const [locale, t, session, query] = await Promise.all([getLocale(), getDictionary(), getSession(), searchParams]);
  const viewerId = session?.user.id ?? null;

  if (!session) {
    const posts = await listFeed({ viewerId: null });
    return (
      <div className="space-y-8">
        <Hero title={t.home.title} lead={t.home.lead} cta={t.home.cta} href={`/${locale}/criar-conta`} />

        <section aria-labelledby="recentes" className="space-y-3">
          <h2 id="recentes" className="font-display text-xl font-bold">
            {t.post.recent}
          </h2>
          {posts.length === 0 ? (
            <p className="text-muted">{t.post.empty}</p>
          ) : (
            <FeedPosts posts={posts} viewerId={null} locale={locale} t={t.post} />
          )}
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
      </div>
    );
  }

  const following = query.aba === "seguindo";
  const [posts, suggestions] = await Promise.all([
    listFeed({ viewerId, scope: following ? "following" : "all" }),
    suggestPeople(viewerId, 10),
  ]);

  const tab = (active: boolean) =>
    `inline-flex min-h-11 flex-1 items-center justify-center border-b-2 font-semibold ${
      active ? "border-primary text-ink" : "border-transparent text-muted"
    }`;

  return (
    <div className="space-y-5">
      <Link
        href={`/${locale}/criar`}
        className="flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3"
      >
        <Avatar displayName={session.user.name} avatarUrl={session.user.image} size={40} />
        <span className="text-muted">{formatMessage(t.feed.composePrompt, { name: session.user.name.split(" ")[0] })}</span>
      </Link>

      {suggestions.length > 0 && (
        <section aria-labelledby="sugestoes" className="space-y-2">
          <h2 id="sugestoes" className="font-display text-lg font-bold">
            {t.feed.suggestionsTitle}
          </h2>
          <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {suggestions.map((person) => (
              <li
                key={person.id}
                className="flex w-36 shrink-0 flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-center"
              >
                <Link href={`/${locale}/u/${person.handle}`} className="flex min-h-11 flex-col items-center gap-1">
                  <Avatar displayName={person.displayName} avatarUrl={person.avatarUrl} size={56} />
                  <span className="w-full truncate text-sm font-semibold">{person.displayName}</span>
                  <span className="w-full truncate text-xs text-muted">@{person.handle}</span>
                </Link>
                <FollowButton userId={person.id} initialFollowing={false} signedIn locale={locale} t={t.follow} compact />
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label={t.feed.tabsLabel} className="flex border-b border-line">
        <Link href={`/${locale}`} aria-current={following ? undefined : "page"} className={tab(!following)}>
          {t.feed.tabForYou}
        </Link>
        <Link
          href={`/${locale}?aba=seguindo`}
          aria-current={following ? "page" : undefined}
          className={tab(following)}
        >
          {t.feed.tabFollowing}
        </Link>
      </nav>

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-5 text-muted">
          {following ? t.feed.followingEmpty : t.post.empty}
        </p>
      ) : (
        <FeedPosts posts={posts} viewerId={viewerId} locale={locale} t={t.post} />
      )}
    </div>
  );
}
