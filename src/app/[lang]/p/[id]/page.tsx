import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { formatMessage, formatRelative } from "@/i18n/format";
import { commentAccess, getPost, listComments } from "@/lib/social/queries";
import { getSession } from "@/lib/auth/session";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { BottomNav } from "@/components/BottomNav";
import { CommentForm } from "@/components/CommentForm";
import { DeleteCommentButton } from "@/components/DeleteCommentButton";
import { PostCard } from "@/components/PostCard";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PostPage({ params }: PageProps<"/[lang]/p/[id]">) {
  const locale = await getLocale();
  const t = await getDictionary();

  return (
    <>
      <AppHeader t={t} locale={locale} />
      <main id="conteudo" className="mx-auto max-w-2xl space-y-4 px-4 pb-28 pt-5">
        <Suspense fallback={<p className="text-muted">{t.post.loading}</p>}>
          <PostContent params={params} />
        </Suspense>
      </main>
      <BottomNav t={t.nav} locale={locale} current="home" />
    </>
  );
}

async function PostContent({ params }: { params: PageProps<"/[lang]/p/[id]">["params"] }) {
  await connection();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const [locale, t, session] = await Promise.all([getLocale(), getDictionary(), getSession()]);
  const viewerId = session?.user.id ?? null;

  const post = await getPost(id, viewerId);
  if (!post) notFound();

  const [comments, access] = await Promise.all([listComments(post.id), commentAccess(post, viewerId)]);

  return (
    <>
      <PostCard
        handle={post.author.handle}
        displayName={post.author.displayName}
        avatarUrl={post.author.avatarUrl}
        caption={post.caption}
        media={post.media}
        dateLabel={formatRelative(post.createdAt, locale)}
        t={t.post}
        social={{
          id: post.id,
          locale,
          signedIn: viewerId !== null,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          likedByMe: post.likedByMe,
          hideCommentLink: true,
        }}
      />

      <section id="comentarios" aria-labelledby="titulo-comentarios" className="scroll-mt-20 space-y-4">
        <h2 id="titulo-comentarios" className="font-display text-xl font-bold">
          {formatMessage(t.post.commentsCount, { n: comments.length })}
        </h2>

        {access === "open" && <CommentForm postId={post.id} t={t.post} />}
        {access === "closed" && <p className="text-sm text-muted">{t.post.commentsClosed}</p>}
        {access === "followersOnly" && <p className="text-sm text-muted">{t.post.commentsFollowers}</p>}
        {access === "signIn" && (
          <p className="text-sm text-muted">
            <Link href={`/${locale}/entrar`} className="font-semibold text-link underline">
              {t.post.signInToInteract}
            </Link>
          </p>
        )}

        {comments.length === 0 ? (
          <p className="text-muted">{t.post.commentsEmpty}</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className="flex gap-3">
                <Link href={`/${locale}/u/${comment.author.handle}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
                  <Avatar displayName={comment.author.displayName} avatarUrl={comment.author.avatarUrl} size={36} />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="break-words">
                    <Link href={`/${locale}/u/${comment.author.handle}`} className="mr-1.5 font-semibold">
                      {comment.author.handle}
                    </Link>
                    {comment.body}
                  </p>
                  <p className="flex items-center gap-2 text-xs text-muted">
                    <span>{formatRelative(comment.createdAt, locale)}</span>
                    {(comment.author.id === viewerId || post.authorId === viewerId) && (
                      <DeleteCommentButton commentId={comment.id} label={t.post.commentDelete} />
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
