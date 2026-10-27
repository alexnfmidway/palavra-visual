import "server-only";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb, schema } from "@/lib/db";
import { isValidHandle, normalizeHandle } from "./handle";

// Login só com e-mail e senha nesta fase: sem CPF, telefone, Google Cloud nem envio de e-mail.
// Para incluir "Entrar com Google" depois, adicione `socialProviders` aqui.
let instance: ReturnType<typeof create> | undefined;

function create() {
  return betterAuth({
    database: drizzleAdapter(getDb(), { provider: "pg", schema, usePlural: true }),
    advanced: { database: { generateId: "uuid" } },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      // Ligar quando houver provedor de e-mail (Resend, etc.): requireEmailVerification: true
    },
    user: {
      fields: { name: "displayName", image: "avatarUrl" },
      additionalFields: {
        handle: { type: "string", required: true, unique: true, input: true },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const handle = normalizeHandle(String((user as { handle?: string }).handle ?? ""));
            if (!isValidHandle(handle)) {
              throw new APIError("BAD_REQUEST", { message: "Nome de usuário inválido." });
            }
            return { data: { ...user, handle } };
          },
        },
      },
    },
    plugins: [nextCookies()], // mantém por último
  });
}

export function getAuth() {
  return (instance ??= create());
}
