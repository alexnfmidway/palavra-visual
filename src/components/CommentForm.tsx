"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addCommentAction } from "@/lib/social/actions";
import { COMMENT_MAX } from "@/lib/social/validation";
import type { Dictionary } from "@/i18n/dictionaries";

export function CommentForm({ postId, t }: { postId: string; t: Dictionary["post"] }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy || !body.trim()) return;
    setBusy(true);
    setError(null);
    const result = await addCommentAction(postId, body);
    if (result.ok) {
      setBody("");
      router.refresh();
    } else {
      setError(t.commentErrors[result.error]);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <label className="sr-only" htmlFor="comentario">
        {t.commentLabel}
      </label>
      <div className="flex items-end gap-2">
        <textarea
          id="comentario"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={COMMENT_MAX}
          rows={1}
          placeholder={t.commentPlaceholder}
          className="min-h-12 w-full resize-none rounded-2xl border border-muted bg-surface px-4 py-3 text-base"
        />
        <button
          type="submit"
          disabled={busy || !body.trim()}
          className="min-h-12 shrink-0 rounded-full bg-primary px-5 font-semibold text-on-primary disabled:opacity-50"
        >
          {busy ? t.commentSending : t.commentSend}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-muted">
          {error}
        </p>
      )}
    </form>
  );
}
