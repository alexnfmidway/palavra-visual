"use client";

import { useState } from "react";
import Link from "next/link";
import { toggleLikeAction } from "@/lib/social/actions";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { HeartIcon } from "./icons";

type Props = {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  signedIn: boolean;
  locale: Locale;
  t: Dictionary["post"];
};

const button = "inline-flex min-h-11 min-w-11 items-center gap-1.5 rounded-full px-2 text-sm font-semibold";

export function LikeButton({ postId, initialLiked, initialCount, signedIn, locale, t }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  if (!signedIn) {
    return (
      <Link href={`/${locale}/entrar`} aria-label={t.signInToInteract} className={`${button} text-muted`}>
        <HeartIcon />
        <span>{count}</span>
      </Link>
    );
  }

  async function toggle() {
    if (busy) return;
    const next = !liked;
    // Atualiza na hora; se o servidor recusar, volta ao estado anterior.
    setBusy(true);
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    const result = await toggleLikeAction(postId);
    if (result.ok) {
      setLiked(result.liked);
      setCount(result.count);
    } else {
      setLiked(!next);
      setCount((c) => c + (next ? -1 : 1));
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? t.unlike : t.like}
      title={formatMessage(t.likes, { n: count })}
      className={`${button} ${liked ? "text-red-500" : "text-ink"}`}
    >
      <HeartIcon filled={liked} />
      <span>{count}</span>
    </button>
  );
}
