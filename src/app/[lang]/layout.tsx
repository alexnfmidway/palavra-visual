import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { brand, brandCss } from "@/config/brand.config";
import { locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "../globals.css";

const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"] });
const body = Plus_Jakarta_Sans({ variable: "--font-body", subsets: ["latin"] });

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: { default: `${brand.name} — ${t.app.tagline}`, template: `%s · ${brand.name}` },
    description: t.app.description,
    applicationName: brand.name,
    icons: { apple: "/icons/apple-touch-icon.png" },
    appleWebApp: { capable: true, title: brand.shortName, statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  themeColor: brand.themeColor,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  const t = await getDictionary();

  return (
    <html lang={locale} className={`${display.variable} ${body.variable} h-full antialiased`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandCss() }} />
      </head>
      <body className="min-h-full">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-20 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
        >
          {t.app.skipToContent}
        </a>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
