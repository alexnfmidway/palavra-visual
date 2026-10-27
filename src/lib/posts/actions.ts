"use server";

import { and, eq, gte, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { extractHashtags, parsePostInput, POSTS_PER_HOUR, type PostError } from "./validation";

export type CreatePostResult = { ok: true; id: string } | { ok: false; error: PostError };

export async function createPostAction(raw: unknown): Promise<CreatePostResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthorized" };

  const parsed = parsePostInput(raw, session.user.id);
  if (!parsed.ok) return parsed;
  const { caption, commentPolicy, media } = parsed.value;

  try {
    const db = getDb();

    // Freio simples contra spam e contas automatizadas.
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const [recent] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.posts)
      .where(and(eq(schema.posts.authorId, session.user.id), gte(schema.posts.createdAt, since)));
    if (recent.n >= POSTS_PER_HOUR) return { ok: false, error: "rateLimited" };

    const id = crypto.randomUUID();
    const insertPost = db.insert(schema.posts).values({
      id,
      authorId: session.user.id,
      caption: caption || null,
      hashtags: extractHashtags(caption),
      commentPolicy,
      visibility: "public", // mídia fica em Blob público; outras visibilidades exigem storage privado
    });

    if (media.length === 0) {
      await insertPost;
    } else {
      // batch roda os dois comandos na mesma transação (o driver HTTP não tem transação interativa).
      await db.batch([
        insertPost,
        db.insert(schema.postMedia).values(
          media.map((m, position) => ({
            postId: id,
            kind: m.kind,
            url: m.url,
            position,
            width: m.width,
            height: m.height,
            durationMs: m.durationMs ?? null,
            altText: m.altText ?? null,
          })),
        ),
      ]);
    }

    return { ok: true, id };
  } catch {
    return { ok: false, error: "generic" };
  }
}
