import type { Dictionary } from "@/i18n/dictionaries";
import { formatMessage } from "@/i18n/format";

export type PostMediaView = {
  kind: "image" | "video";
  url: string;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
};

type Props = {
  handle: string;
  displayName: string;
  caption?: string | null;
  media: PostMediaView[];
  dateLabel: string;
  t: Dictionary["post"];
};

function renderCaption(caption: string) {
  return caption.split(/(#[\p{L}\p{N}_]{2,50})/gu).map((part, i) =>
    part.startsWith("#") ? (
      <span key={i} className="font-semibold text-secondary">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export function PostCard({ handle, displayName, caption, media, dateLabel, t }: Props) {
  const carousel = media.length > 1;

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface">
      <header className="flex items-baseline justify-between gap-3 px-4 py-3">
        <p className="truncate">
          <span className="font-semibold">{displayName}</span> <span className="text-muted">@{handle}</span>
        </p>
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

      {caption && <p className="whitespace-pre-line break-words px-4 py-3">{renderCaption(caption)}</p>}
    </article>
  );
}
