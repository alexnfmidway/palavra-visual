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

/** "há 5 min", "há 2 h", "há 3 dias"; passada uma semana, a data curta. */
export function formatRelative(value: Date | string | number, locale: Locale, now: number = Date.now()) {
  const seconds = Math.round((new Date(value).getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  if (abs < 60) return rtf.format(0, "second");
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 7 * 86400) return rtf.format(Math.round(seconds / 86400), "day");
  return formatDate(value, locale, { dateStyle: "medium" });
}

export function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale).format(value);
}

/** Contagens curtas: 1,2 mil, 3,4 mi. */
export function formatCompact(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale, { notation: "compact" }).format(value);
}
