import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { formatMessage } from "@/i18n/format";
import { Avatar } from "./Avatar";
import { LikeButton } from "./LikeButton";
import { CommentIcon } from "./icons";

export type PostMediaView = {
  kind: "image" | "video";
  url: string;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
};

/** Dados de interação. Sem isto o cartão é só leitura (por exemplo, na prévia do compositor). */
export type PostSocial = {
  id: string;
  locale: Locale;
  signedIn: boolean;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  /** Na página da própria publicação o link "ver comentários" não faz sentido. */
  hideCommentLink?: boolean;
};

type Props = {
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  caption?: string | null;
  media: PostMediaView[];
  dateLabel: string;
  t: Dictionary["post"];
  social?: PostSocial;
};

function renderCaption(caption: string, locale?: Locale) {
  return caption.split(/(#[\p{L}\p{N}_]{2,50})/gu).map((part, i) => {
    if (!part.startsWith("#")) return part;
    const className = "font-semibold text-link";
    return locale ? (
      <Link key={i} href={`/${locale}/descobrir?tag=${encodeURIComponent(part.slice(1).toLowerCase())}`} className={className}>
        {part}
      </Link>
    ) : (
      <span key={i} className={className}>
        {part}
      </span>
    );
  });
}

export function PostCard({ handle, displayName, avatarUrl, caption, media, dateLabel, t, social }: Props) {
  const carousel = media.length > 1;
  const profileHref = social ? `/${social.locale}/u/${handle}` : undefined;

  const identity = (
    <>
      <Avatar displayName={displayName} avatarUrl={avatarUrl} size={40} />
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-semibold">{displayName}</span>
        <span className="block truncate text-sm text-muted">@{handle}</span>
      </span>
    </>
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface">
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        {profileHref ? (
          <Link href={profileHref} className="flex min-h-11 min-w-0 items-center gap-3">
            {identity}
          </Link>
        ) : (
          <div className="flex min-w-0 items-center gap-3">{identity}</div>
        )}
        <time className="shrink-0 text-xs text-muted">{dateLabel}</time>
      </header>

      {media.length > 0 && (
        <div
          className={carousel ? "flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1" : undefined}
          aria-label={carousel ? `${media.length} fotos` : undefined}
        >
          {media.map((item) =>
            item.kind === "video" ? (
              <video
                key={item.url}
                src={item.url}
                controls
                playsInline
                preload="metadata"
                width={item.width ?? undefined}
                height={item.height ?? undefined}
                className="max-h-[75vh] w-full bg-line object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- mídia do usuário vinda do Blob
              <img
                key={item.url}
                src={item.url}
                alt={item.altText || formatMessage(t.imageAlt, { handle })}
                width={item.width ?? undefined}
                height={item.height ?? undefined}
                loading="lazy"
                decoding="async"
                className={`max-h-[75vh] bg-line object-contain ${carousel ? "w-[85%] shrink-0 snap-center rounded-xl" : "w-full"}`}
              />
            ),
          )}
        </div>
      )}

      {social && (
        <div className="flex items-center gap-1 px-2 pt-1">
          <LikeButton
            postId={social.id}
            initialLiked={social.likedByMe}
            initialCount={social.likeCount}
            signedIn={social.signedIn}
            locale={social.locale}
            t={t}
          />
          {social.hideCommentLink ? (
            <span className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-muted">
              <CommentIcon />
              {social.commentCount}
            </span>
          ) : (
            <Link
              href={`/${social.locale}/p/${social.id}#comentarios`}
              aria-label={`${t.openComments} (${formatMessage(t.commentsCount, { n: social.commentCount })})`}
              className="inline-flex min-h-11 min-w-11 items-center gap-1.5 rounded-full px-2 text-sm font-semibold"
            >
              <CommentIcon />
              {social.commentCount}
            </Link>
          )}
        </div>
      )}

      {caption && (
        <p className="whitespace-pre-line break-words px-4 py-3">
          {social && (
            <Link href={profileHref!} className="mr-1.5 font-semibold">
              {handle}
            </Link>
          )}
          {renderCaption(caption, social?.locale)}
        </p>
      )}
    </article>
  );
}
