"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toggleFollowAction } from "@/lib/social/actions";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

type Props = {
  userId: string;
  initialFollowing: boolean;
  signedIn: boolean;
  locale: Locale;
  t: Dictionary["follow"];
  /** Botão compacto para listas. */
  compact?: boolean;
};

export function FollowButton({ userId, initialFollowing, signedIn, locale, t, compact = false }: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const size = compact ? "min-h-10 px-4 text-sm" : "min-h-11 px-6";
  const filled = `${size} inline-flex items-center justify-center rounded-full bg-primary font-semibold text-on-primary`;
  const outline = `${size} inline-flex items-center justify-center rounded-full border border-muted font-semibold`;

  if (!signedIn) {
    return (
      <Link href={`/${locale}/entrar`} className={filled}>
        {compact ? t.follow : t.signInToFollow}
      </Link>
    );
  }

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    const result = await toggleFollowAction(userId);
    if (result.ok) {
      setFollowing(result.following);
      router.refresh(); // atualiza as contagens e o feed "Seguindo"
    } else {
      setFailed(true);
    }
    setBusy(false);
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={following}
        className={`${following ? outline : filled} disabled:opacity-60`}
      >
        {following ? t.following : t.follow}
      </button>
      {failed && (
        <span role="alert" className="mt-1 text-xs text-muted">
          {t.error}
        </span>
      )}
    </span>
  );
}
