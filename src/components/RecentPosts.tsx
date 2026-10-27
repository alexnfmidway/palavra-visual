import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { formatDateTime } from "@/i18n/format";
import { listRecentPosts } from "@/lib/posts/queries";
import { PostCard } from "./PostCard";

export async function RecentPosts() {
  const [locale, t, posts] = await Promise.all([getLocale(), getDictionary(), listRecentPosts()]);

  if (posts.length === 0) return <p className="text-muted">{t.post.empty}</p>;

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          handle={post.author.handle}
          displayName={post.author.displayName}
          caption={post.caption}
          media={post.media}
          dateLabel={formatDateTime(post.createdAt, locale)}
          t={t.post}
        />
      ))}
    </div>
  );
}
