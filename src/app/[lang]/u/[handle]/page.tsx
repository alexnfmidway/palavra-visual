import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { formatCompact, formatMessage } from "@/i18n/format";
import { getSession } from "@/lib/auth/session";
import { getProfile, listGrid } from "@/lib/social/queries";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { BottomNav } from "@/components/BottomNav";
import { FollowButton } from "@/components/FollowButton";
import { PostGrid } from "@/components/PostGrid";

const HANDLE = /^[a-z0-9_]{3,20}$/;

export async function generateMetadata({ params }: PageProps<"/[lang]/u/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  return { title: `@${handle}` };
}

export default async function ProfilePage({ params }: PageProps<"/[lang]/u/[handle]">) {
  const locale = await getLocale();
  const t = await getDictionary();

  return (
    <>
      <AppHeader t={t} locale={locale} />
      <main id="conteudo" className="mx-auto max-w-2xl px-4 pb-28 pt-5">
        <Suspense fallback={<p className="text-muted">{t.post.loading}</p>}>
          <ProfileContent params={params} />
        </Suspense>
      </main>
      <BottomNav t={t.nav} locale={locale} current={null} />
    </>
  );
}

async function ProfileContent({ params }: { params: PageProps<"/[lang]/u/[handle]">["params"] }) {
  await connection();
  const { handle } = await params;
  if (!HANDLE.test(handle)) notFound();

  const [locale, t, session] = await Promise.all([getLocale(), getDictionary(), getSession()]);
  const viewerId = session?.user.id ?? null;
  const profile = await getProfile(handle, viewerId);
  if (!profile) notFound();

  const grid = await listGrid({ authorId: profile.id });

  const stat = (value: number, label: string) => (
    <li className="min-w-0 text-center">
      <span className="block font-display text-xl font-bold">{formatCompact(value, locale)}</span>
      <span className="block truncate text-xs text-muted sm:text-sm">{label}</span>
    </li>
  );

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar displayName={profile.displayName} avatarUrl={profile.avatarUrl} size={80} />
          <ul className="grid min-w-0 flex-1 grid-cols-3 gap-1">
            {stat(profile.postCount, t.follow.posts)}
            {stat(profile.followerCount, t.follow.followers)}
            {stat(profile.followingCount, t.follow.followingCount)}
          </ul>
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold">{profile.displayName}</h1>
          <p className="text-muted">@{profile.handle}</p>
          {profile.bio && <p className="mt-2 whitespace-pre-line break-words">{profile.bio}</p>}
        </div>

        {profile.isMe ? (
          <Link
            href={`/${locale}/perfil/editar`}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-muted font-semibold"
          >
            {t.follow.editProfile}
          </Link>
        ) : (
          <FollowButton
            userId={profile.id}
            initialFollowing={profile.isFollowing}
            signedIn={viewerId !== null}
            locale={locale}
            t={t.follow}
          />
        )}
      </section>

      {grid.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-5 text-muted">
          {profile.isMe ? t.profile.noPostsMine : t.profile.noPosts}
        </p>
      ) : (
        <PostGrid posts={grid} locale={locale} label={formatMessage(t.profile.gridLabel, { handle: profile.handle })} t={t.profile} />
      )}
    </div>
  );
}
