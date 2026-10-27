// Limites compartilhados entre o navegador e o servidor (o servidor sempre revalida).

export const COMMENT_MAX = 500;
export const COMMENTS_PER_10_MIN = 30;
export const NAME_MAX = 50;
export const BIO_MAX = 160;

export type CommentError = "unauthorized" | "empty" | "tooLong" | "closed" | "rateLimited" | "generic";

export type ProfileError = "unauthorized" | "invalidName" | "bioTooLong" | "invalidAvatar" | "generic";
