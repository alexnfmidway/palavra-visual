import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { GridPost } from "@/lib/social/queries";
import { LayersIcon, PlayIcon } from "./icons";

type Props = { posts: GridPost[]; locale: Locale; label: string; t: Dictionary["profile"] };

const badge = "absolute right-2 top-2 rounded-full bg-black/45 p-1 text-white";

/** Grade de miniaturas quadradas, como no perfil do Instagram. */
export function PostGrid({ posts, locale, label, t }: Props) {
  return (
    <ul aria-label={label} className="grid grid-cols-3 gap-1">
      {posts.map((post) => (
        <li key={post.id} className="relative aspect-square overflow-hidden bg-line">
          <Link href={`/${locale}/p/${post.id}`} className="block h-full w-full">
            {post.cover?.kind === "image" && (
              // eslint-disable-next-line @next/next/no-img-element -- mídia do usuário vinda do Blob
              <img
                src={post.cover.url}
                alt={post.cover.altText || post.caption?.slice(0, 80) || ""}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            )}
            {post.cover?.kind === "video" && (
              <video
                src={`${post.cover.url}#t=0.1`}
                muted
                playsInline
                preload="metadata"
                aria-label={post.caption?.slice(0, 80) || t.video}
                className="h-full w-full object-cover"
              />
            )}
            {!post.cover && (
              <span className="flex h-full w-full items-center justify-center bg-linear-to-br from-hero-from via-hero-via to-hero-to p-2 text-center text-xs font-semibold text-on-hero">
                <span className="line-clamp-5 break-words">{post.caption}</span>
              </span>
            )}
          </Link>
          {post.cover?.kind === "video" && (
            <span className={badge} title={t.video}>
              <PlayIcon className="h-4 w-4" />
            </span>
          )}
          {post.mediaCount > 1 && (
            <span className={badge} title={t.multiple}>
              <LayersIcon className="h-4 w-4" />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
