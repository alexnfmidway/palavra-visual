"use server";

import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { isOwnMediaUrl } from "@/lib/posts/validation";
import { BIO_MAX, COMMENT_MAX, COMMENTS_PER_10_MIN, NAME_MAX, type CommentError, type ProfileError } from "./validation";

const { posts, users, follows, likes, comments } = schema;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Publicação visível para quem pede: pública, ou do próprio autor. */
async function findVisiblePost(postId: string, viewerId: string) {
  if (!UUID.test(postId)) return null;
  const [post] = await getDb()
    .select({ id: posts.id, authorId: posts.authorId, visibility: posts.visibility, commentPolicy: posts.commentPolicy })
    .from(posts)
    .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
    .limit(1);
  if (!post) return null;
  if (post.visibility !== "public" && post.authorId !== viewerId) return null;
  return post;
}

export type LikeResult = { ok: true; liked: boolean; count: number } | { ok: false };

export async function toggleLikeAction(postId: string): Promise<LikeResult> {
  const session = await getSession();
  if (!session) return { ok: false };

  try {
    const post = await findVisiblePost(postId, session.user.id);
    if (!post) return { ok: false };

    const db = getDb();
    const where = and(eq(likes.userId, session.user.id), eq(likes.postId, post.id));
    const [existing] = await db.select({ postId: likes.postId }).from(likes).where(where).limit(1);

    if (existing) await db.delete(likes).where(where);
    else await db.insert(likes).values({ userId: session.user.id, postId: post.id }).onConflictDoNothing();

    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(likes)
      .where(eq(likes.postId, post.id));
    return { ok: true, liked: !existing, count: n };
  } catch {
    return { ok: false };
  }
}

export type FollowResult = { ok: true; following: boolean } | { ok: false };

export async function toggleFollowAction(targetId: string): Promise<FollowResult> {
  const session = await getSession();
  if (!session || !UUID.test(targetId) || targetId === session.user.id) return { ok: false };

  try {
    const db = getDb();
    const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, targetId)).limit(1);
    if (!target) return { ok: false };

    const where = and(eq(follows.followerId, session.user.id), eq(follows.followedId, targetId));
    const [existing] = await db.select({ id: follows.followedId }).from(follows).where(where).limit(1);

    if (existing) await db.delete(follows).where(where);
    else await db.insert(follows).values({ followerId: session.user.id, followedId: targetId }).onConflictDoNothing();
    return { ok: true, following: !existing };
  } catch {
    return { ok: false };
  }
}

export type CommentResult = { ok: true } | { ok: false; error: CommentError };

export async function addCommentAction(postId: string, rawBody: unknown): Promise<CommentResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthorized" };

  const body = typeof rawBody === "string" ? rawBody.trim() : "";
  if (!body) return { ok: false, error: "empty" };
  if (body.length > COMMENT_MAX) return { ok: false, error: "tooLong" };

  try {
    const db = getDb();
    const post = await findVisiblePost(postId, session.user.id);
    if (!post) return { ok: false, error: "generic" };

    if (post.authorId !== session.user.id) {
      if (post.commentPolicy === "nobody") return { ok: false, error: "closed" };
      if (post.commentPolicy === "followers") {
        // "Quem eu sigo": só comenta quem a pessoa autora segue.
        const [allowed] = await db
          .select({ id: follows.followedId })
          .from(follows)
          .where(and(eq(follows.followerId, post.authorId), eq(follows.followedId, session.user.id)))
          .limit(1);
        if (!allowed) return { ok: false, error: "closed" };
      }
    }

    const since = new Date(Date.now() - 10 * 60 * 1000);
    const [recent] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(comments)
      .where(and(eq(comments.authorId, session.user.id), gte(comments.createdAt, since)));
    if (recent.n >= COMMENTS_PER_10_MIN) return { ok: false, error: "rateLimited" };

    await db.insert(comments).values({ postId: post.id, authorId: session.user.id, body });
    return { ok: true };
  } catch {
    return { ok: false, error: "generic" };
  }
}

/** Quem escreveu o comentário, ou quem é dono da publicação, pode excluir. */
export async function deleteCommentAction(commentId: string): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session || !UUID.test(commentId)) return { ok: false };

  try {
    const db = getDb();
    const [row] = await db
      .select({ authorId: comments.authorId, postAuthorId: posts.authorId })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(and(eq(comments.id, commentId), isNull(comments.deletedAt)))
      .limit(1);
    if (!row || (row.authorId !== session.user.id && row.postAuthorId !== session.user.id)) return { ok: false };

    await db.update(comments).set({ deletedAt: new Date() }).where(eq(comments.id, commentId));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export type ProfileResult = { ok: true } | { ok: false; error: ProfileError };

/** `avatarUrl`: string = nova foto; null = remover; undefined = manter. */
export async function updateProfileAction(raw: unknown): Promise<ProfileResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthorized" };
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "generic" };
  const input = raw as Record<string, unknown>;

  const displayName = typeof input.displayName === "string" ? input.displayName.trim() : "";
  if (displayName.length < 1 || displayName.length > NAME_MAX) return { ok: false, error: "invalidName" };

  const bio = typeof input.bio === "string" ? input.bio.trim() : "";
  if (bio.length > BIO_MAX) return { ok: false, error: "bioTooLong" };

  let avatarUrl: string | null | undefined;
  if (input.avatarUrl === null) avatarUrl = null;
  else if (typeof input.avatarUrl === "string") {
    if (!isOwnMediaUrl(input.avatarUrl, session.user.id, "avatars")) return { ok: false, error: "invalidAvatar" };
    avatarUrl = input.avatarUrl;
  }

  try {
    await getDb()
      .update(users)
      .set({
        displayName,
        bio: bio || null,
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));
    return { ok: true };
  } catch {
    return { ok: false, error: "generic" };
  }
}
