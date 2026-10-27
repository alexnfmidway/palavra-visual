import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "./config";

import type ptBR from "./messages/pt-BR.json";

// pt-BR é a referência de chaves: todo idioma novo precisa ter o mesmo formato.
export type Dictionary = typeof ptBR;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  "pt-BR": () => import("./messages/pt-BR.json").then((m) => m.default),
};

export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!hasLocale(value)) notFound();
  return value;
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()]();
}
