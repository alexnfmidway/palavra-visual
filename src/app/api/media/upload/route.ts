import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { getSession } from "@/lib/auth/session";
import { mediaLimits } from "@/config/media";

// Autoriza o envio direto do navegador para o Blob. O arquivo não passa por aqui
// (funções da Vercel limitam o corpo a ~4,5 MB); só emitimos uma URL assinada, e só para quem
// está logado, para a própria pasta, com tipo e tamanho limitados.
// O store novo da Vercel autentica por OIDC (BLOB_STORE_ID), sem BLOB_READ_WRITE_TOKEN.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadPresignedBody;
  const session = await getSession();

  try {
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname, clientPayload) => {
        if (!session) throw new Error("Entre na sua conta para enviar mídia.");
        const isAvatar = pathname.startsWith(`avatars/${session.user.id}/`);
        if (!isAvatar && !pathname.startsWith(`posts/${session.user.id}/`)) throw new Error("Caminho de upload inválido.");

        // Foto de perfil: só imagem, e pequena.
        const isVideo = !isAvatar && clientPayload === "video";
        const allowedContentTypes = [...(isVideo ? mediaLimits.videoTypes : mediaLimits.imageTypes)];
        const maximumSizeInBytes = isVideo ? mediaLimits.videoMaxBytes : isAvatar ? 2 * 1024 * 1024 : mediaLimits.imageMaxBytes;

        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          allowedContentTypes,
          maximumSizeInBytes,
        });
        return { token, urlOptions: { allowedContentTypes, maximumSizeInBytes, addRandomSuffix: true } };
      },
    });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha no upload." }, { status: 400 });
  }
}
