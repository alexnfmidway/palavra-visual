// Idiomas suportados. A v1 é só pt-BR; novos idiomas entram aqui e em ./messages.
export const locales = ["pt-BR"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "pt-BR";

// Fuso padrão quando o usuário ainda não escolheu um (o Brasil tem vários fusos).
export const defaultTimeZone = "America/Sao_Paulo";

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
