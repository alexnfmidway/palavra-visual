import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSession } from "@/lib/auth/session";
import { mediaLimits } from "@/config/media";

// Autoriza o envio direto do navegador para o Blob. O arquivo não passa por aqui
// (funções da Vercel limitam o corpo a ~4,5 MB); só emitimos o token, e só para quem
// está logado, para a própria pasta, com tipo e tamanho limitados.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  const session = await getSession();

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!session) throw new Error("Entre na sua conta para enviar mídia.");
        if (!pathname.startsWith(`posts/${session.user.id}/`)) throw new Error("Caminho de upload inválido.");

        const isVideo = clientPayload === "video";
        return {
          allowedContentTypes: [...(isVideo ? mediaLimits.videoTypes : mediaLimits.imageTypes)],
          maximumSizeInBytes: isVideo ? mediaLimits.videoMaxBytes : mediaLimits.imageMaxBytes,
          addRandomSuffix: true,
          tokenPayload: session.user.id,
        };
      },
      // O registro da publicação é criado pela ação createPostAction, não por este callback
      // (que também não chega em localhost).
      onUploadCompleted: async () => {},
    });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha no upload." }, { status: 400 });
  }
}
