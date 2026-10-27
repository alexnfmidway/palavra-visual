// Limites de mídia da fase de teste gratuita. Ajuste ao mudar de plano de armazenamento.
// Atenção: funções da Vercel aceitam corpo de até ~4,5 MB; arquivos maiores precisam
// de upload direto do navegador para o storage (próxima etapa).
export const mediaLimits = {
  imageMaxBytes: 10 * 1024 * 1024,
  videoMaxBytes: 25 * 1024 * 1024,
  videoMaxSeconds: 30,
  imagesPerPost: 10,
  imageTypes: ["image/jpeg", "image/png", "image/webp"],
  videoTypes: ["video/mp4", "video/webm"],
} as const;
