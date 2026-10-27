import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, hasLocale } from "@/i18n/config";

// Garante o idioma na URL (/pt-BR/...). Com mais idiomas, é aqui que se negocia
// pelo cabeçalho Accept-Language e pela preferência salva do usuário.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1] ?? "";
  if (hasLocale(first)) return;

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Ignora _next, api e qualquer arquivo com extensão (manifest, sw.js, ícones, etc.).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
