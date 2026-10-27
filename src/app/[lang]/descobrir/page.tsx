import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { formatMessage } from "@/i18n/format";
import { getSession } from "@/lib/auth/session";
import {
  listGrid,
  listGridByHashtag,
  searchPeople,
  suggestPeople,
  trendingHashtags,
} from "@/lib/social/queries";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { PersonRow } from "@/components/PersonRow";
import { PostGrid } from "@/components/PostGrid";
import { SearchIcon } from "@/components/icons";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).discover.title };
}

export default async function DiscoverPage({ searchParams }: PageProps<"/[lang]/descobrir">) {
  const locale = await getLocale();
  const t = await getDictionary();

  return (
    <>
      <AppHeader t={t} locale={locale} />
      <main id="conteudo" className="mx-auto max-w-2xl space-y-6 px-4 pb-28 pt-5">
        <Suspense fallback={<p className="text-muted">{t.post.loading}</p>}>
          <DiscoverContent searchParams={searchParams} />
        </Suspense>
      </main>
      <BottomNav t={t.nav} locale={locale} current="discover" />
    </>
  );
}

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
const TAG = /^[\p{L}\p{N}_]{2,50}$/u;

async function DiscoverContent({ searchParams }: { searchParams: PageProps<"/[lang]/descobrir">["searchParams"] }) {
  await connection();
  const [locale, t, session, query] = await Promise.all([getLocale(), getDictionary(), getSession(), searchParams]);
  const viewerId = session?.user.id ?? null;
  const d = t.discover;

  const rawQuery = one(query.q).slice(0, 60);
  const rawTag = one(query.tag).replace(/^#/, "").toLowerCase();
  // "#música" na busca vale como hashtag.
  const tag = TAG.test(rawTag) ? rawTag : rawQuery.startsWith("#") && TAG.test(rawQuery.slice(1)) ? rawQuery.slice(1).toLowerCase() : "";
  const text = rawQuery.replace(/^#/, "");

  const searchBox = (
    <form action={`/${locale}/descobrir`} role="search" className="flex gap-2">
      <label className="sr-only" htmlFor="busca">
        {d.searchLabel}
      </label>
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id="busca"
          name="q"
          type="search"
          defaultValue={rawQuery || (tag ? `#${tag}` : "")}
          placeholder={d.searchPlaceholder}
          maxLength={60}
          autoComplete="off"
          className="min-h-12 w-full rounded-full border border-muted bg-surface pl-11 pr-4 text-base"
        />
      </div>
      <button type="submit" className="min-h-12 rounded-full bg-primary px-5 font-semibold text-on-primary">
        {d.search}
      </button>
    </form>
  );

  if (tag) {
    const grid = await listGridByHashtag(tag);
    return (
      <>
        {searchBox}
        <section aria-labelledby="titulo-tag" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h1 id="titulo-tag" className="font-display text-2xl font-bold">
              {formatMessage(d.postsWithTag, { tag })}
            </h1>
            <Link href={`/${locale}/descobrir`} className="min-h-11 content-center text-sm font-semibold text-link underline">
              {d.clear}
            </Link>
          </div>
          {grid.length === 0 ? (
            <p className="text-muted">{d.noPostsWithTag}</p>
          ) : (
            <PostGrid posts={grid} locale={locale} label={formatMessage(d.postsWithTag, { tag })} t={t.profile} />
          )}
        </section>
      </>
    );
  }

  if (text) {
    const people = await searchPeople(text, viewerId);
    const slug = text.toLowerCase().replace(/\s+/g, "");
    return (
      <>
        {searchBox}
        {TAG.test(slug) && (
          <Link
            href={`/${locale}/descobrir?tag=${encodeURIComponent(slug)}`}
            className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 font-semibold text-link"
          >
            {formatMessage(d.searchTag, { tag: slug })}
          </Link>
        )}
        <section aria-labelledby="pessoas" className="space-y-2">
          <h1 id="pessoas" className="font-display text-xl font-bold">
            {d.people}
          </h1>
          {people.length === 0 ? (
            <p className="text-muted">{d.noPeople}</p>
          ) : (
            <ul className="divide-y divide-line">
              {people.map((person) => (
                <PersonRow key={person.id} person={person} viewerId={viewerId} locale={locale} t={t.follow} />
              ))}
            </ul>
          )}
        </section>
      </>
    );
  }

  const [tags, people, grid] = await Promise.all([
    trendingHashtags(),
    suggestPeople(viewerId, 6),
    listGrid({ onlyWithMedia: true, limit: 36 }),
  ]);

  return (
    <>
      {searchBox}

      <section aria-labelledby="em-alta" className="space-y-2">
        <h2 id="em-alta" className="font-display text-xl font-bold">
          {d.trending}
        </h2>
        {tags.length === 0 ? (
          <p className="text-sm text-muted">{d.trendingEmpty}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {tags.map(({ tag: name }) => (
              <li key={name}>
                <Link
                  href={`/${locale}/descobrir?tag=${encodeURIComponent(name)}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 font-semibold text-link"
                >
                  #{name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {people.length > 0 && (
        <section aria-labelledby="gente" className="space-y-1">
          <h2 id="gente" className="font-display text-xl font-bold">
            {t.feed.suggestionsTitle}
          </h2>
          <ul className="divide-y divide-line">
            {people.map((person) => (
              <PersonRow key={person.id} person={person} viewerId={viewerId} locale={locale} t={t.follow} />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="novidades" className="space-y-2">
        <h2 id="novidades" className="font-display text-xl font-bold">
          {d.recent}
        </h2>
        {grid.length === 0 ? (
          <p className="text-muted">{t.post.empty}</p>
        ) : (
          <PostGrid posts={grid} locale={locale} label={d.recent} t={t.profile} />
        )}
      </section>
    </>
  );
}
