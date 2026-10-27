"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { uploadPresigned } from "@vercel/blob/client";
import { authClient } from "@/lib/auth/client";
import { createPostAction } from "@/lib/posts/actions";
import { ALT_MAX, CAPTION_MAX, COMMENT_POLICIES, type CommentPolicy, type MediaInput } from "@/lib/posts/validation";
import { mediaLimits } from "@/config/media";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { PostCard } from "./PostCard";

type Props = { t: Dictionary["create"]; tPost: Dictionary["post"]; locale: Locale };

type Item = {
  id: string;
  kind: "image" | "video";
  file: File;
  previewUrl: string;
  width?: number;
  height?: number;
  durationMs?: number;
  alt: string;
};

const RAW_IMAGE_MAX_BYTES = 30 * 1024 * 1024;
const IMAGE_MAX_SIDE = 1600;
const MULTIPART_FROM_BYTES = 8 * 1024 * 1024;

const isType = (list: readonly string[], type: string) => list.includes(type);

class ComposerError extends Error {
  constructor(readonly code: keyof Dictionary["create"]["errors"]) {
    super(code);
  }
}

function readVideoMeta(url: string) {
  return new Promise<{ durationMs: number; width: number; height: number }>((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () =>
      resolve({ durationMs: Math.round(video.duration * 1000), width: video.videoWidth, height: video.videoHeight });
    video.onerror = () => reject(new ComposerError("unreadable"));
    video.src = url;
  });
}

// Reduz a foto no aparelho: economiza dados em conexão lenta e, ao redesenhar,
// descarta os metadados da câmera (inclusive a localização).
async function resizeImage(file: File) {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ComposerError("unreadable");
  }
  const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new ComposerError("unreadable");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  if (!blob) throw new ComposerError("unreadable");
  return { blob, width, height };
}

const extensionOf = (type: string) => (type === "image/jpeg" ? "jpg" : type.split("/")[1] ?? "bin");

const fieldClass = "min-h-12 w-full rounded-xl border border-muted bg-surface px-4 text-base";

export function Composer({ t, tPost, locale }: Props) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const fileInput = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<Item[]>([]);

  const [items, setItems] = useState<Item[]>([]);
  const [caption, setCaption] = useState("");
  const [commentPolicy, setCommentPolicy] = useState<CommentPolicy>("everyone");
  const [step, setStep] = useState<"write" | "preview">("write");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Libera as prévias (URLs locais) ao sair da tela.
  useEffect(() => () => itemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl)), []);

  function fail(code: keyof Dictionary["create"]["errors"]) {
    setError(t.errors[code]);
  }

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    setError(null);

    let next = [...items];
    for (const file of picked) {
      const kind = isType(mediaLimits.imageTypes, file.type) ? "image" : isType(mediaLimits.videoTypes, file.type) ? "video" : null;
      if (!kind) return fail("invalidType");
      if (kind === "image" && file.size > RAW_IMAGE_MAX_BYTES) return fail("fileTooLarge");
      if (kind === "video" && file.size > mediaLimits.videoMaxBytes) return fail("fileTooLarge");
      if (kind === "video" && next.length > 0) return fail("mixedMedia");
      if (kind === "image" && next.some((item) => item.kind === "video")) return fail("mixedMedia");
      if (next.length >= mediaLimits.imagesPerPost) return fail("tooManyMedia");

      const previewUrl = URL.createObjectURL(file);
      const item: Item = { id: crypto.randomUUID(), kind, file, previewUrl, alt: "" };

      if (kind === "video") {
        try {
          const meta = await readVideoMeta(previewUrl);
          if (meta.durationMs > mediaLimits.videoMaxSeconds * 1000) {
            URL.revokeObjectURL(previewUrl);
            return fail("videoTooLong");
          }
          Object.assign(item, meta);
        } catch {
          URL.revokeObjectURL(previewUrl);
          return fail("unreadable");
        }
      }
      next = [...next, item];
      setItems(next);
    }
  }

  function removeItem(id: string) {
    setItems((current) => {
      current.filter((item) => item.id === id).forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return current.filter((item) => item.id !== id);
    });
  }

  function setAlt(id: string, alt: string) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, alt } : item)));
  }

  async function uploadAll(userId: string): Promise<MediaInput[]> {
    const result: MediaInput[] = [];
    for (const [index, item] of items.entries()) {
      let body: Blob = item.file;
      let width = item.width;
      let height = item.height;
      let contentType = item.file.type;

      if (item.kind === "image") {
        const resized = await resizeImage(item.file);
        body = resized.blob;
        width = resized.width;
        height = resized.height;
        contentType = resized.blob.type;
      }
      if (body.size > (item.kind === "video" ? mediaLimits.videoMaxBytes : mediaLimits.imageMaxBytes)) {
        throw new ComposerError("fileTooLarge");
      }

      const blob = await uploadPresigned(`posts/${userId}/${crypto.randomUUID()}.${extensionOf(contentType)}`, body, {
        access: "public",
        handleUploadUrl: "/api/media/upload",
        clientPayload: item.kind,
        contentType,
        multipart: body.size > MULTIPART_FROM_BYTES,
        onUploadProgress: ({ percentage }) =>
          setProgress(Math.round(((index + percentage / 100) / items.length) * 100)),
      });

      result.push({
        kind: item.kind,
        url: blob.url,
        width: width ?? 1,
        height: height ?? 1,
        durationMs: item.durationMs,
        altText: item.alt.trim() || undefined,
      });
    }
    return result;
  }

  async function publish() {
    if (!session) return;
    setError(null);
    setProgress(0);
    setBusy(true);
    try {
      const media = await uploadAll(session.user.id);
      const result = await createPostAction({ caption, commentPolicy, media });
      if (!result.ok) return fail(result.error);
      router.push(`/${locale}/p/${result.id}`);
    } catch (caught) {
      fail(caught instanceof ComposerError ? caught.code : "uploadFailed");
    } finally {
      setBusy(false);
    }
  }

  if (isPending) return null;

  if (!session) {
    return (
      <p className="space-y-4">
        <span className="block text-lg">{t.signInRequired}</span>
        <Link
          href={`/${locale}/entrar`}
          className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-semibold text-on-primary"
        >
          {t.signIn}
        </Link>
      </p>
    );
  }

  const canPreview = items.length > 0 || caption.trim().length > 0;

  return (
    <div className="space-y-6">
      <ol className="flex gap-4 text-sm" aria-label={t.title}>
        <li className={step === "write" ? "font-bold text-link" : "text-muted"} aria-current={step === "write" ? "step" : undefined}>
          {t.stepWrite}
        </li>
        <li className={step === "preview" ? "font-bold text-link" : "text-muted"} aria-current={step === "preview" ? "step" : undefined}>
          {t.stepPreview}
        </li>
      </ol>

      {step === "write" ? (
        <>
          <section className="space-y-3">
            <input
              ref={fileInput}
              type="file"
              accept={[...mediaLimits.imageTypes, ...mediaLimits.videoTypes].join(",")}
              multiple
              onChange={onPick}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="min-h-14 w-full rounded-2xl border-2 border-dashed border-muted px-4 font-semibold"
            >
              {t.addMedia}
            </button>
            <p className="text-xs text-muted">{t.mediaHint}</p>

            {items.length > 0 && (
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.id} className="space-y-2 rounded-2xl border border-line bg-surface p-3">
                    {item.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:)
                      <img src={item.previewUrl} alt="" className="max-h-72 w-full rounded-xl bg-line object-contain" />
                    ) : (
                      <video src={item.previewUrl} controls playsInline preload="metadata" className="max-h-72 w-full rounded-xl bg-line" />
                    )}
                    <label className="block space-y-1">
                      <span className="text-sm font-semibold">{t.altLabel}</span>
                      <input
                        value={item.alt}
                        maxLength={ALT_MAX}
                        onChange={(event) => setAlt(item.id, event.target.value)}
                        aria-describedby={`alt-${item.id}`}
                        className={fieldClass}
                      />
                      <span id={`alt-${item.id}`} className="block text-xs text-muted">
                        {t.altHint}
                      </span>
                    </label>
                    <button type="button" onClick={() => removeItem(item.id)} className="min-h-11 rounded-full border border-line px-4 text-sm">
                      {t.remove}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <label className="block space-y-1">
            <span className="text-sm font-semibold">{t.captionLabel}</span>
            <textarea
              value={caption}
              maxLength={CAPTION_MAX}
              rows={5}
              onChange={(event) => setCaption(event.target.value)}
              placeholder={t.captionPlaceholder}
              aria-describedby="caption-count"
              className={`${fieldClass} py-3`}
            />
            <span id="caption-count" className="block text-xs text-muted">
              {formatMessage(t.charsLeft, { n: CAPTION_MAX - caption.length })}
            </span>
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-semibold">{t.commentsLabel}</span>
            <select value={commentPolicy} onChange={(event) => setCommentPolicy(event.target.value as CommentPolicy)} className={fieldClass}>
              {COMMENT_POLICIES.map((policy) => (
                <option key={policy} value={policy}>
                  {t.comments[policy]}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-muted">{t.publicNote}</p>

          {error && (
            <p role="alert" className="rounded-xl border border-line bg-surface p-3 text-sm">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={!canPreview}
            onClick={() => {
              setError(null);
              setStep("preview");
            }}
            className="min-h-12 w-full rounded-full bg-primary px-6 font-semibold text-on-primary disabled:opacity-50"
          >
            {t.preview}
          </button>
        </>
      ) : (
        <>
          <PostCard
            handle={session.user.handle}
            displayName={session.user.name}
            caption={caption.trim()}
            media={items.map((item) => ({
              kind: item.kind,
              url: item.previewUrl,
              width: item.width,
              height: item.height,
              altText: item.alt,
            }))}
            dateLabel={tPost.justNow}
            t={tPost}
          />

          {busy && (
            <div role="status" className="space-y-2">
              <p className="text-sm">{formatMessage(t.uploading, { pct: progress })}</p>
              <progress value={progress} max={100} className="h-2 w-full" />
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl border border-line bg-surface p-3 text-sm">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={busy}
              onClick={() => setStep("write")}
              className="min-h-12 rounded-full border border-muted px-6 font-semibold disabled:opacity-50"
            >
              {t.back}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={publish}
              className="min-h-12 flex-1 rounded-full bg-primary px-6 font-semibold text-on-primary disabled:opacity-60"
            >
              {busy ? t.publishing : t.publish}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
