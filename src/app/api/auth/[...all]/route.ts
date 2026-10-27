import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

// Roda o Better Auth em /api/auth/*. A instância é criada no primeiro acesso
// para o build não depender de DATABASE_URL.
export const GET = (request: Request) => toNextJsHandler(getAuth()).GET(request);
export const POST = (request: Request) => toNextJsHandler(getAuth()).POST(request);
