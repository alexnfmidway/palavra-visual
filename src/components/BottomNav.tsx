import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

type Key = "home" | "discover" | "create" | "notifications" | "profile";
type Item = { key: Key; href?: string };

// Itens sem href ainda não existem e aparecem como "em breve".
const items: Item[] = [
  { key: "home", href: "" },
  { key: "discover" },
  { key: "create", href: "/criar" },
  { key: "notifications" },
  { key: "profile" },
];

const base = "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-2 text-xs";

export function BottomNav({ t, locale, current }: { t: Dictionary["nav"]; locale: Locale; current: Key }) {
  return (
    <nav
      aria-label={t.label}
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-2xl">
        {items.map(({ key, href }) => (
          <li key={key} className="flex flex-1">
            {href !== undefined ? (
              <Link
                href={`/${locale}${href}`}
                aria-current={key === current ? "page" : undefined}
                className={`${base} ${key === current ? "font-semibold text-link" : "text-muted"}`}
              >
                {t[key]}
              </Link>
            ) : (
              <span aria-disabled="true" className={`${base} text-muted`}>
                {t[key]}
                <span className="text-[10px] opacity-80">{t.soon}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
