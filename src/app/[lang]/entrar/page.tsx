import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).auth.signIn };
}

export default async function SignInPage() {
  const locale = await getLocale();
  const t = await getDictionary();

  return (
    <main id="conteudo" className="mx-auto max-w-md space-y-6 px-4 py-10">
      <Logo />
      <h1 className="font-display text-3xl font-bold">{t.auth.signInTitle}</h1>
      <AuthForm mode="sign-in" t={t.auth} locale={locale} />
    </main>
  );
}
