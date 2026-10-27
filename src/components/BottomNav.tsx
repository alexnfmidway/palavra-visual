import Link from "next/link";
import type { ComponentType } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { HeartIcon, HomeIcon, PlusIcon, SearchIcon, UserIcon } from "./icons";

type Key = "home" | "discover" | "create" | "notifications" | "profile";
type Item = { key: Key; href: string; Icon: ComponentType<{ filled?: boolean; className?: string }> };

const items: Item[] = [
  { key: "home", href: "", Icon: HomeIcon },
  { key: "discover", href: "/descobrir", Icon: SearchIcon },
  { key: "create", href: "/criar", Icon: PlusIcon },
  { key: "notifications", href: "/avisos", Icon: HeartIcon },
  { key: "profile", href: "/perfil", Icon: UserIcon },
];

const base = "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-2 text-[11px]";

export function BottomNav({ t, locale, current }: { t: Dictionary["nav"]; locale: Locale; current: Key | null }) {
  return (
    <nav
      aria-label={t.label}
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-2xl">
        {items.map(({ key, href, Icon }) => {
          const active = key === current;
          return (
            <li key={key} className="flex flex-1">
              <Link
                href={`/${locale}${href}`}
                aria-current={active ? "page" : undefined}
                className={`${base} ${active ? "font-semibold text-ink" : "text-muted"}`}
              >
                {key === "create" ? (
                  <span className="flex h-8 w-11 items-center justify-center rounded-xl bg-linear-to-br from-primary via-accent to-stripe-blue text-on-primary">
                    <Icon />
                  </span>
                ) : (
                  <Icon filled={active} />
                )}
                <span className={key === "create" ? "sr-only" : undefined}>{t[key]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
