import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getSession } from "@/lib/auth/session";
import { getOwnProfileFields } from "@/lib/social/queries";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ProfileEditor } from "@/components/ProfileEditor";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).editProfile.title };
}

export default async function EditProfilePage() {
  const locale = await getLocale();
  const t = await getDictionary();

  return (
    <>
      <AppHeader t={t} locale={locale} />
      <main id="conteudo" className="mx-auto max-w-2xl space-y-5 px-4 pb-28 pt-5">
        <h1 className="font-display text-3xl font-bold">{t.editProfile.title}</h1>
        <Suspense fallback={<p className="text-muted">{t.post.loading}</p>}>
          <Editor />
        </Suspense>
      </main>
      <BottomNav t={t.nav} locale={locale} current="profile" />
    </>
  );
}

async function Editor() {
  await connection();
  const [locale, t, session] = await Promise.all([getLocale(), getDictionary(), getSession()]);
  const me = session ? await getOwnProfileFields(session.user.id) : null;

  if (!session || !me) {
    return (
      <p>
        {t.editProfile.signInRequired}{" "}
        <Link href={`/${locale}/entrar`} className="font-semibold text-link underline">
          {t.auth.signIn}
        </Link>
      </p>
    );
  }

  return (
    <ProfileEditor
      t={t.editProfile}
      locale={locale}
      userId={session.user.id}
      handle={me.handle}
      initial={{ displayName: me.displayName, bio: me.bio ?? "", avatarUrl: me.avatarUrl }}
    />
  );
}
