import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { formatDateTime } from "@/i18n/format";
import { getPostById } from "@/lib/posts/queries";
import { getSession } from "@/lib/auth/session";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { PostCard } from "@/components/PostCard";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function PostPage({ params }: PageProps<"/[lang]/p/[id]">) {
  return (
    <Suspense fallback={null}>
      <PostContent params={params} />
    </Suspense>
  );
}

async function PostContent({ params }: { params: PageProps<"/[lang]/p/[id]">["params"] }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const [locale, t, post] = await Promise.all([getLocale(), getDictionary(), getPostById(id)]);
  if (!post) notFound();

  // Só a pessoa autora vê publicações que não são públicas.
  if (post.visibility !== "public") {
    const session = await getSession();
    if (session?.user.id !== post.authorId) notFound();
  }

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href={`/${locale}`} aria-label={t.post.back}>
            <Logo />
          </Link>
        </div>
      </header>

      <main id="conteudo" className="mx-auto max-w-2xl space-y-4 px-4 pb-28 pt-6">
        <PostCard
          handle={post.author.handle}
          displayName={post.author.displayName}
          caption={post.caption}
          media={post.media}
          dateLabel={formatDateTime(post.createdAt, locale)}
          t={t.post}
        />
        <Link href={`/${locale}`} className="inline-flex min-h-11 items-center font-semibold text-primary underline">
          {t.post.back}
        </Link>
      </main>

      <BottomNav t={t.nav} locale={locale} current="home" />
    </>
  );
}
