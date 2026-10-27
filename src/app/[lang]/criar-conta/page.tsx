import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).auth.signUp };
}

export default async function SignUpPage() {
  const locale = await getLocale();
  const t = await getDictionary();

  return (
    <main id="conteudo" className="mx-auto max-w-md space-y-6 px-4 py-10">
      <Logo />
      <h1 className="font-display text-3xl font-bold">{t.auth.signUpTitle}</h1>
      <p className="text-muted">{t.auth.signUpLead}</p>
      <AuthForm mode="sign-up" t={t.auth} locale={locale} />
    </main>
  );
}
