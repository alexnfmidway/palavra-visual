import "server-only";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

/** Publicações públicas mais recentes. Ordem por data, sem depender de popularidade. */
export async function listRecentPosts(limit = 20) {
  return getDb().query.posts.findMany({
    where: and(eq(schema.posts.visibility, "public"), isNull(schema.posts.deletedAt)),
    orderBy: [desc(schema.posts.createdAt)],
    limit,
    with: {
      author: { columns: { id: true, handle: true, displayName: true } },
      media: { orderBy: [asc(schema.postMedia.position)] },
    },
  });
}

export async function getPostById(id: string) {
  return getDb().query.posts.findFirst({
    where: and(eq(schema.posts.id, id), isNull(schema.posts.deletedAt)),
    with: {
      author: { columns: { id: true, handle: true, displayName: true } },
      media: { orderBy: [asc(schema.postMedia.position)] },
    },
  });
}
