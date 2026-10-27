import { mediaLimits } from "@/config/media";

// Regras de publicação compartilhadas entre o navegador e o servidor.
// O servidor sempre revalida: nada que vem do cliente é confiável.

export const CAPTION_MAX = 2200;
export const ALT_MAX = 500;
export const MAX_HASHTAGS = 15;
export const POSTS_PER_HOUR = 20;

export const COMMENT_POLICIES = ["everyone", "followers", "nobody"] as const;
export type CommentPolicy = (typeof COMMENT_POLICIES)[number];

export type MediaInput = {
  kind: "image" | "video";
  url: string;
  width: number;
  height: number;
  durationMs?: number;
  altText?: string;
};

export type PostInput = {
  caption: string;
  commentPolicy: CommentPolicy;
  media: MediaInput[];
};

export type PostError =
  | "unauthorized"
  | "empty"
  | "tooManyMedia"
  | "mixedMedia"
  | "captionTooLong"
  | "invalidMedia"
  | "rateLimited"
  | "generic";

const HASHTAG = /#([\p{L}\p{N}_]{2,50})/gu;

export function extractHashtags(caption: string): string[] {
  const found = new Set<string>();
  for (const match of caption.normalize("NFC").matchAll(HASHTAG)) {
    found.add(match[1].toLowerCase());
    if (found.size >= MAX_HASHTAGS) break;
  }
  return [...found];
}

/** A mídia precisa estar no nosso Blob e dentro da pasta do próprio autor. */
export function isOwnMediaUrl(value: string, userId: string, folder: "posts" | "avatars" = "posts") {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com") &&
      url.pathname.startsWith(`/${folder}/${userId}/`)
    );
  } catch {
    return false;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isDimension = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 20000;

export function parsePostInput(raw: unknown, userId: string): { ok: true; value: PostInput } | { ok: false; error: PostError } {
  if (!isRecord(raw)) return { ok: false, error: "generic" };

  const caption = typeof raw.caption === "string" ? raw.caption.trim() : "";
  if (caption.length > CAPTION_MAX) return { ok: false, error: "captionTooLong" };

  const commentPolicy = (COMMENT_POLICIES as readonly unknown[]).includes(raw.commentPolicy)
    ? (raw.commentPolicy as CommentPolicy)
    : "everyone";

  const list = Array.isArray(raw.media) ? raw.media : [];
  if (list.length === 0 && caption.length === 0) return { ok: false, error: "empty" };
  if (list.length > mediaLimits.imagesPerPost) return { ok: false, error: "tooManyMedia" };

  const media: MediaInput[] = [];
  for (const entry of list) {
    if (!isRecord(entry)) return { ok: false, error: "invalidMedia" };
    const { kind, url, width, height, durationMs, altText } = entry;
    if (kind !== "image" && kind !== "video") return { ok: false, error: "invalidMedia" };
    if (typeof url !== "string" || !isOwnMediaUrl(url, userId)) return { ok: false, error: "invalidMedia" };
    if (!isDimension(width) || !isDimension(height)) return { ok: false, error: "invalidMedia" };
    if (kind === "video" && (typeof durationMs !== "number" || durationMs <= 0 || durationMs > mediaLimits.videoMaxSeconds * 1000 + 1000)) {
      return { ok: false, error: "invalidMedia" };
    }
    media.push({
      kind,
      url,
      width,
      height,
      durationMs: kind === "video" ? Math.round(durationMs as number) : undefined,
      altText: typeof altText === "string" && altText.trim() ? altText.trim().slice(0, ALT_MAX) : undefined,
    });
  }

  // Uma publicação tem fotos (carrossel) ou um único vídeo, nunca os dois.
  const videos = media.filter((m) => m.kind === "video").length;
  if (videos > 1 || (videos === 1 && media.length > 1)) return { ok: false, error: "mixedMedia" };

  return { ok: true, value: { caption, commentPolicy, media } };
}
