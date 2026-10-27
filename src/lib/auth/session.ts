import "server-only";
import { headers } from "next/headers";
import { getAuth } from "./index";

/** Sessão do usuário da requisição atual, ou null se não estiver logado. */
export async function getSession() {
  return getAuth().api.getSession({ headers: await headers() });
}
