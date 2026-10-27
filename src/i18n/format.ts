import { defaultTimeZone, type Locale } from "./config";

// Datas e números sempre pelo idioma e fuso do usuário, nunca com formato fixo.
// Este arquivo é seguro para o navegador e para o servidor.

/** Troca `{chave}` pelos valores informados. */
export function formatMessage(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

export function formatDate(
  value: Date | string | number,
  locale: Locale,
  options: Intl.DateTimeFormatOptions & { timeZone?: string } = {},
) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: defaultTimeZone,
    ...options,
  }).format(new Date(value));
}

export function formatDateTime(
  value: Date | string | number,
  locale: Locale,
  timeZone: string = defaultTimeZone,
) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short", timeZone }).format(
    new Date(value),
  );
}

export function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale).format(value);
}

/** Contagens curtas: 1,2 mil, 3,4 mi. */
export function formatCompact(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale, { notation: "compact" }).format(value);
}
