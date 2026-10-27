import "server-only";
import { del, put } from "@vercel/blob";

// Camada de armazenamento de mídia. O app só conhece esta interface; para trocar
// o Vercel Blob por Cloudflare R2 ou S3, basta incluir outra implementação aqui.

export type StoredObject = {
  url: string;
  pathname: string;
  contentType: string;
};

export interface MediaStorage {
  put(pathname: string, body: Blob | ArrayBuffer | ReadableStream, contentType: string): Promise<StoredObject>;
  remove(url: string): Promise<void>;
}

const vercelBlob: MediaStorage = {
  async put(pathname, body, contentType) {
    const result = await put(pathname, body, { access: "public", contentType, addRandomSuffix: true });
    return { url: result.url, pathname: result.pathname, contentType };
  },
  async remove(url) {
    await del(url);
  },
};

export function getStorage(): MediaStorage {
  const provider = process.env.STORAGE_PROVIDER ?? "vercel-blob";
  if (provider === "vercel-blob") return vercelBlob;
  throw new Error(`STORAGE_PROVIDER desconhecido: ${provider}`);
}
