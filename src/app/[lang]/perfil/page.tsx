import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getLocale } from "@/i18n/dictionaries";
import { getSession } from "@/lib/auth/session";
import { getOwnProfileFields } from "@/lib/social/queries";

// "Perfil" na barra inferior: leva ao perfil público da própria pessoa, ou ao login.
export default function MyProfilePage() {
  return (
    <Suspense fallback={null}>
      <GoToProfile />
    </Suspense>
  );
}

async function GoToProfile() {
  await connection();
  const [locale, session] = await Promise.all([getLocale(), getSession()]);
  if (!session) redirect(`/${locale}/entrar`);

  const me = await getOwnProfileFields(session.user.id);
  redirect(me ? `/${locale}/u/${me.handle}` : `/${locale}/entrar`);
  return null; // redirect() nunca retorna; o retorno só satisfaz o tipo de componente
}
