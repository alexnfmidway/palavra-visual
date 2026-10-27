import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { PersonView } from "@/lib/social/queries";
import { Avatar } from "./Avatar";
import { FollowButton } from "./FollowButton";

type Props = { person: PersonView; viewerId: string | null; locale: Locale; t: Dictionary["follow"] };

export function PersonRow({ person, viewerId, locale, t }: Props) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <Link href={`/${locale}/u/${person.handle}`} className="flex min-h-11 min-w-0 items-center gap-3">
        <Avatar displayName={person.displayName} avatarUrl={person.avatarUrl} size={48} />
        <span className="min-w-0 leading-tight">
          <span className="block truncate font-semibold">{person.displayName}</span>
          <span className="block truncate text-sm text-muted">@{person.handle}</span>
        </span>
      </Link>
      {person.id !== viewerId && (
        <FollowButton
          userId={person.id}
          initialFollowing={person.isFollowing}
          signedIn={viewerId !== null}
          locale={locale}
          t={t}
          compact
        />
      )}
    </li>
  );
}
