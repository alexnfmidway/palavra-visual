"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

export function HeaderAccount({ t, locale }: { t: Dictionary["auth"]; locale: Locale }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <span className="h-11 w-20" aria-hidden="true" />;

  if (!session) {
    return (
      <Link
        href={`/${locale}/entrar`}
        className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm font-semibold"
      >
        {t.signIn}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href={`/${locale}/perfil`} className="inline-flex min-h-11 items-center font-semibold">
        @{session.user.handle}
      </Link>
      <button
        type="button"
        onClick={async () => {
          await authClient.signOut();
          router.refresh();
        }}
        className="min-h-11 rounded-full border border-line px-4"
      >
        {t.signOut}
      </button>
    </div>
  );
}
