import "server-only";
import { and, asc, desc, eq, gt, ilike, inArray, isNull, ne, notInArray, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

const { posts, postMedia, users, follows, likes, comments } = schema;

const authorColumns = { id: true, handle: true, displayName: true, avatarUrl: true } as const;

export type FeedPost = {
  id: string;
  authorId: string;
  caption: string | null;
  createdAt: Date;
  commentPolicy: "everyone" | "followers" | "nobody";
  author: { id: string; handle: string; displayName: string; avatarUrl: string | null };
  media: { kind: "image" | "video"; url: string; width: number | null; height: number | null; altText: string | null }[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

type RawPost = Omit<FeedPost, "likeCount" | "commentCount" | "likedByMe">;

/** Soma curtidas e comentários de uma vez só, em vez de uma consulta por publicação. */
async function withCounts(rows: RawPost[], viewerId: string | null): Promise<FeedPost[]> {
  if (rows.length === 0) return [];
  const db = getDb();
  const ids = rows.map((row) => row.id);

  const [likeRows, commentRows, mine] = await Promise.all([
    db
      .select({ postId: likes.postId, n: sql<number>`count(*)::int` })
      .from(likes)
      .where(inArray(likes.postId, ids))
      .groupBy(likes.postId),
    db
      .select({ postId: comments.postId, n: sql<number>`count(*)::int` })
      .from(comments)
      .where(and(inArray(comments.postId, ids), isNull(comments.deletedAt)))
      .groupBy(comments.postId),
    viewerId
      ? db
          .select({ postId: likes.postId })
          .from(likes)
          .where(and(eq(likes.userId, viewerId), inArray(likes.postId, ids)))
      : Promise.resolve([] as { postId: string }[]),
  ]);

  const likeCount = new Map(likeRows.map((r) => [r.postId, r.n]));
  const commentCount = new Map(commentRows.map((r) => [r.postId, r.n]));
  const liked = new Set(mine.map((r) => r.postId));

  return rows.map((row) => ({
    ...row,
    likeCount: likeCount.get(row.id) ?? 0,
    commentCount: commentCount.get(row.id) ?? 0,
    likedByMe: liked.has(row.id),
  }));
}

const withRelations = {
  author: { columns: authorColumns },
  media: { orderBy: [asc(postMedia.position)] },
};

type FeedOptions = {
  viewerId: string | null;
  /** "following" mostra só quem o usuário segue (e ele mesmo). */
  scope?: "all" | "following";
  hashtag?: string;
  authorId?: string;
  limit?: number;
};

/** Publicações públicas, da mais nova para a mais antiga (sem ranking por popularidade). */
export async function listFeed({ viewerId, scope = "all", hashtag, authorId, limit = 30 }: FeedOptions) {
  const db = getDb();
  const conditions = [eq(posts.visibility, "public"), isNull(posts.deletedAt)];

  if (scope === "following" && viewerId) {
    const followedIds = db.select({ id: follows.followedId }).from(follows).where(eq(follows.followerId, viewerId));
    conditions.push(or(eq(posts.authorId, viewerId), inArray(posts.authorId, followedIds))!);
  }
  if (hashtag) conditions.push(sql`${hashtag} = ANY(${posts.hashtags})`);
  if (authorId) conditions.push(eq(posts.authorId, authorId));

  const rows = await db.query.posts.findMany({
    where: and(...conditions),
    orderBy: [desc(posts.createdAt)],
    limit,
    with: withRelations,
  });
  return withCounts(rows, viewerId);
}

export async function getPost(id: string, viewerId: string | null) {
  const row = await getDb().query.posts.findFirst({
    where: and(eq(posts.id, id), isNull(posts.deletedAt)),
    with: withRelations,
  });
  if (!row) return null;
  // Só a pessoa autora vê publicações que não são públicas.
  if (row.visibility !== "public" && row.authorId !== viewerId) return null;
  const [post] = await withCounts([row], viewerId);
  return post;
}

/** Quem pode comentar, pela regra escolhida por quem publicou (a ação do servidor revalida). */
export async function commentAccess(
  post: { authorId: string; commentPolicy: "everyone" | "followers" | "nobody" },
  viewerId: string | null,
): Promise<"open" | "closed" | "followersOnly" | "signIn"> {
  if (!viewerId) return "signIn";
  if (post.authorId === viewerId || post.commentPolicy === "everyone") return "open";
  if (post.commentPolicy === "nobody") return "closed";
  const [row] = await getDb()
    .select({ id: follows.followedId })
    .from(follows)
    .where(and(eq(follows.followerId, post.authorId), eq(follows.followedId, viewerId)))
    .limit(1);
  return row ? "open" : "followersOnly";
}

export type CommentView = {
  id: string;
  body: string;
  createdAt: Date;
  author: { id: string; handle: string; displayName: string; avatarUrl: string | null };
};

export async function listComments(postId: string, limit = 100): Promise<CommentView[]> {
  const rows = await getDb()
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      authorId: users.id,
      handle: users.handle,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(and(eq(comments.postId, postId), isNull(comments.deletedAt)))
    .orderBy(asc(comments.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt,
    author: { id: r.authorId, handle: r.handle, displayName: r.displayName, avatarUrl: r.avatarUrl },
  }));
}

export type Profile = {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
  isMe: boolean;
  isFollowing: boolean;
};

const count = () => sql<number>`count(*)::int`;

export async function getProfile(handle: string, viewerId: string | null): Promise<Profile | null> {
  const db = getDb();
  const [user] = await db
    .select({ id: users.id, handle: users.handle, displayName: users.displayName, bio: users.bio, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.handle, handle))
    .limit(1);
  if (!user) return null;

  const [[postRow], [followerRow], [followingRow], following] = await Promise.all([
    db
      .select({ n: count() })
      .from(posts)
      .where(and(eq(posts.authorId, user.id), eq(posts.visibility, "public"), isNull(posts.deletedAt))),
    db.select({ n: count() }).from(follows).where(eq(follows.followedId, user.id)),
    db.select({ n: count() }).from(follows).where(eq(follows.followerId, user.id)),
    viewerId
      ? db
          .select({ id: follows.followedId })
          .from(follows)
          .where(and(eq(follows.followerId, viewerId), eq(follows.followedId, user.id)))
          .limit(1)
      : Promise.resolve([]),
  ]);

  return {
    ...user,
    postCount: postRow.n,
    followerCount: followerRow.n,
    followingCount: followingRow.n,
    isMe: viewerId === user.id,
    isFollowing: following.length > 0,
  };
}

export type GridPost = {
  id: string;
  caption: string | null;
  mediaCount: number;
  cover: { kind: "image" | "video"; url: string; altText: string | null } | null;
};

/** Publicações em miniatura (grade do perfil e do Descobrir). */
export async function listGrid({
  authorId,
  onlyWithMedia = false,
  limit = 60,
}: {
  authorId?: string;
  onlyWithMedia?: boolean;
  limit?: number;
}): Promise<GridPost[]> {
  const conditions = [eq(posts.visibility, "public"), isNull(posts.deletedAt)];
  if (authorId) conditions.push(eq(posts.authorId, authorId));
  // Texto literal: dentro da consulta relacional o Drizzle reescreve as colunas de postMedia para "posts".
  if (onlyWithMedia) conditions.push(sql`exists (select 1 from "post_media" "pm" where "pm"."post_id" = ${posts.id})`);

  const rows = await getDb().query.posts.findMany({
    where: and(...conditions),
    orderBy: [desc(posts.createdAt)],
    limit,
    columns: { id: true, caption: true },
    with: { media: { orderBy: [asc(postMedia.position)], columns: { kind: true, url: true, altText: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    caption: row.caption,
    mediaCount: row.media.length,
    cover: row.media[0] ?? null,
  }));
}

export async function listGridByHashtag(hashtag: string, limit = 60): Promise<GridPost[]> {
  const rows = await getDb().query.posts.findMany({
    where: and(eq(posts.visibility, "public"), isNull(posts.deletedAt), sql`${hashtag} = ANY(${posts.hashtags})`),
    orderBy: [desc(posts.createdAt)],
    limit,
    columns: { id: true, caption: true },
    with: { media: { orderBy: [asc(postMedia.position)], columns: { kind: true, url: true, altText: true } } },
  });
  return rows.map((row) => ({
    id: row.id,
    caption: row.caption,
    mediaCount: row.media.length,
    cover: row.media[0] ?? null,
  }));
}

export type PersonView = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  isFollowing: boolean;
};

async function markFollowing(
  people: { id: string; handle: string; displayName: string; avatarUrl: string | null }[],
  viewerId: string | null,
): Promise<PersonView[]> {
  if (people.length === 0) return [];
  const followed = new Set<string>();
  if (viewerId) {
    const rows = await getDb()
      .select({ id: follows.followedId })
      .from(follows)
      .where(and(eq(follows.followerId, viewerId), inArray(follows.followedId, people.map((p) => p.id))));
    rows.forEach((r) => followed.add(r.id));
  }
  return people.map((p) => ({ ...p, isFollowing: followed.has(p.id) }));
}

/** Escapa % e _ para que a busca trate o texto digitado literalmente. */
const likePattern = (text: string) => `%${text.replace(/[\\%_]/g, "\\$&")}%`;

export async function searchPeople(query: string, viewerId: string | null, limit = 20) {
  const pattern = likePattern(query);
  const rows = await getDb()
    .select({ id: users.id, handle: users.handle, displayName: users.displayName, avatarUrl: users.avatarUrl })
    .from(users)
    .where(or(ilike(users.handle, pattern), ilike(users.displayName, pattern)))
    .orderBy(asc(users.handle))
    .limit(limit);
  return markFollowing(rows, viewerId);
}

/** Sugestões simples: contas mais recentes que a pessoa ainda não segue. */
export async function suggestPeople(viewerId: string | null, limit = 10) {
  const db = getDb();
  const conditions = [];
  if (viewerId) {
    const followedIds = db.select({ id: follows.followedId }).from(follows).where(eq(follows.followerId, viewerId));
    conditions.push(ne(users.id, viewerId), notInArray(users.id, followedIds));
  }
  const rows = await db
    .select({ id: users.id, handle: users.handle, displayName: users.displayName, avatarUrl: users.avatarUrl })
    .from(users)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(limit);
  return rows.map((p) => ({ ...p, isFollowing: false }));
}

/** #hashtags mais usadas nos últimos 30 dias. */
export async function trendingHashtags(limit = 12) {
  const db = getDb();
  const tags = db
    .select({ tag: sql<string>`unnest(${posts.hashtags})`.as("tag") })
    .from(posts)
    .where(
      and(
        eq(posts.visibility, "public"),
        isNull(posts.deletedAt),
        gt(posts.createdAt, sql`now() - interval '30 days'`),
      ),
    )
    .as("tags");
  return db
    .select({ tag: tags.tag, n: count() })
    .from(tags)
    .groupBy(tags.tag)
    .orderBy(desc(count()), asc(tags.tag))
    .limit(limit);
}

export type ActivityItem = {
  kind: "like" | "comment" | "follow";
  at: Date;
  postId: string | null;
  text: string | null;
  who: { handle: string; displayName: string; avatarUrl: string | null };
};

/** Avisos derivados das curtidas, comentários e novos seguidores (sem tabela própria). */
export async function listActivity(viewerId: string, limit = 40): Promise<ActivityItem[]> {
  const db = getDb();
  const [likeRows, commentRows, followRows] = await Promise.all([
    db
      .select({
        at: likes.createdAt,
        postId: likes.postId,
        handle: users.handle,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(likes)
      .innerJoin(posts, eq(likes.postId, posts.id))
      .innerJoin(users, eq(likes.userId, users.id))
      .where(and(eq(posts.authorId, viewerId), ne(likes.userId, viewerId), isNull(posts.deletedAt)))
      .orderBy(desc(likes.createdAt))
      .limit(limit),
    db
      .select({
        at: comments.createdAt,
        postId: comments.postId,
        body: comments.body,
        handle: users.handle,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(
        and(
          eq(posts.authorId, viewerId),
          ne(comments.authorId, viewerId),
          isNull(posts.deletedAt),
          isNull(comments.deletedAt),
        ),
      )
      .orderBy(desc(comments.createdAt))
      .limit(limit),
    db
      .select({ at: follows.createdAt, handle: users.handle, displayName: users.displayName, avatarUrl: users.avatarUrl })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followedId, viewerId))
      .orderBy(desc(follows.createdAt))
      .limit(limit),
  ]);

  const items: ActivityItem[] = [
    ...likeRows.map((r) => ({
      kind: "like" as const,
      at: r.at,
      postId: r.postId,
      text: null,
      who: { handle: r.handle, displayName: r.displayName, avatarUrl: r.avatarUrl },
    })),
    ...commentRows.map((r) => ({
      kind: "comment" as const,
      at: r.at,
      postId: r.postId,
      text: r.body,
      who: { handle: r.handle, displayName: r.displayName, avatarUrl: r.avatarUrl },
    })),
    ...followRows.map((r) => ({
      kind: "follow" as const,
      at: r.at,
      postId: null,
      text: null,
      who: { handle: r.handle, displayName: r.displayName, avatarUrl: r.avatarUrl },
    })),
  ];
  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

export async function getOwnProfileFields(userId: string) {
  const [row] = await getDb()
    .select({ displayName: users.displayName, bio: users.bio, avatarUrl: users.avatarUrl, handle: users.handle })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}
