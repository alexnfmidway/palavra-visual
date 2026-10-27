import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { formatRelative } from "@/i18n/format";
import type { FeedPost } from "@/lib/social/queries";
import { PostCard } from "./PostCard";

type Props = { posts: FeedPost[]; viewerId: string | null; locale: Locale; t: Dictionary["post"]; hideCommentLink?: boolean };

/** Lista de publicações com curtir, comentar e link para o perfil. */
export function FeedPosts({ posts, viewerId, locale, t, hideCommentLink }: Props) {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          handle={post.author.handle}
          displayName={post.author.displayName}
          avatarUrl={post.author.avatarUrl}
          caption={post.caption}
          media={post.media}
          dateLabel={formatRelative(post.createdAt, locale)}
          t={t}
          social={{
            id: post.id,
            locale,
            signedIn: viewerId !== null,
            likeCount: post.likeCount,
            commentCount: post.commentCount,
            likedByMe: post.likedByMe,
            hideCommentLink,
          }}
        />
      ))}
    </div>
  );
}
