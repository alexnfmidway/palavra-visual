"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCommentAction } from "@/lib/social/actions";

export function DeleteCommentButton({ commentId, label }: { commentId: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const result = await deleteCommentAction(commentId);
        if (result.ok) router.refresh();
        else setBusy(false);
      }}
      className="min-h-11 px-2 text-xs text-muted underline disabled:opacity-50"
    >
      {label}
    </button>
  );
}
