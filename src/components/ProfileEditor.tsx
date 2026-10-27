"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { uploadPresigned } from "@vercel/blob/client";
import { updateProfileAction } from "@/lib/social/actions";
import { BIO_MAX, NAME_MAX } from "@/lib/social/validation";
import { mediaLimits } from "@/config/media";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { Avatar } from "./Avatar";

type Props = {
  t: Dictionary["editProfile"];
  locale: Locale;
  userId: string;
  handle: string;
  initial: { displayName: string; bio: string; avatarUrl: string | null };
};

const AVATAR_SIDE = 512;
const field = "min-h-12 w-full rounded-xl border border-muted bg-surface px-4 text-base";

// Recorta o centro em quadrado, reduz e redesenha (isso também descarta os dados da câmera).
async function cropSquare(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(AVATAR_SIDE, side);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob) throw new Error("blob");
  return blob;
}

export function ProfileEditor({ t, locale, userId, handle, initial }: Props) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [bio, setBio] = useState(initial.bio);
  const [avatarUrl] = useState(initial.avatarUrl);
  const [newAvatar, setNewAvatar] = useState<{ blob: Blob; previewUrl: string } | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shownAvatar = newAvatar ? newAvatar.previewUrl : removeAvatar ? null : avatarUrl;

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    if (!(mediaLimits.imageTypes as readonly string[]).includes(file.type)) return setError(t.errors.invalidType);
    try {
      const blob = await cropSquare(file);
      if (newAvatar) URL.revokeObjectURL(newAvatar.previewUrl);
      setNewAvatar({ blob, previewUrl: URL.createObjectURL(blob) });
      setRemoveAvatar(false);
    } catch {
      setError(t.errors.unreadable);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      let nextAvatar: string | null | undefined;
      if (newAvatar) {
        try {
          const uploaded = await uploadPresigned(`avatars/${userId}/${crypto.randomUUID()}.webp`, newAvatar.blob, {
            access: "public",
            handleUploadUrl: "/api/media/upload",
            clientPayload: "avatar",
            contentType: "image/webp",
          });
          nextAvatar = uploaded.url;
        } catch {
          return setError(t.errors.uploadFailed);
        }
      } else if (removeAvatar) {
        nextAvatar = null;
      }

      const result = await updateProfileAction({ displayName, bio, avatarUrl: nextAvatar });
      if (!result.ok) return setError(t.errors[result.error]);
      router.push(`/${locale}/u/${handle}`);
      router.refresh();
    } catch {
      setError(t.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center gap-4">
        {/* Prévia local (blob:) ou a foto atual; o componente Avatar cobre o caso sem foto. */}
        {newAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- prévia local da foto escolhida
          <img src={newAvatar.previewUrl} alt="" width={88} height={88} className="h-22 w-22 rounded-full object-cover" />
        ) : (
          <Avatar displayName={displayName || handle} avatarUrl={shownAvatar} size={88} />
        )}
        <div className="flex flex-col items-start gap-1">
          <span className="text-sm font-semibold">{t.avatar}</span>
          <input
            ref={fileInput}
            type="file"
            accept={mediaLimits.imageTypes.join(",")}
            onChange={onPick}
            className="sr-only"
            aria-label={t.changeAvatar}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="min-h-11 rounded-full border border-muted px-4 text-sm font-semibold"
          >
            {t.changeAvatar}
          </button>
          {(avatarUrl || newAvatar) && !removeAvatar && (
            <button
              type="button"
              onClick={() => {
                if (newAvatar) URL.revokeObjectURL(newAvatar.previewUrl);
                setNewAvatar(null);
                setRemoveAvatar(true);
              }}
              className="min-h-11 px-2 text-sm text-muted underline"
            >
              {t.removeAvatar}
            </button>
          )}
        </div>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-semibold">{t.name}</span>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          required
          maxLength={NAME_MAX}
          autoComplete="name"
          className={field}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-semibold">{t.bio}</span>
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={BIO_MAX}
          rows={3}
          aria-describedby="bio-hint"
          className="w-full rounded-xl border border-muted bg-surface px-4 py-3 text-base"
        />
        <span id="bio-hint" className="block text-xs text-muted">
          {t.bioHint}
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-xl border border-line bg-surface p-3 text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="min-h-12 w-full rounded-full bg-primary px-6 font-semibold text-on-primary disabled:opacity-60"
      >
        {busy ? t.saving : t.save}
      </button>
    </form>
  );
}
