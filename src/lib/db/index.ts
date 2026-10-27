import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Único ponto de acesso ao banco. Trocar de provedor Postgres muda só este arquivo.
let db: ReturnType<typeof create> | undefined;

function create(url: string) {
  return drizzle(neon(url), { schema });
}

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não está definida. Copie .env.example para .env.local.");
  return (db ??= create(url));
}

export { schema };
