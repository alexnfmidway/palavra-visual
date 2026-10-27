# Palavra-Visual

Rede social brasileira (PWA, mobile-first, pt-BR) para compartilhar fotos, vídeos e palavras.

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha DATABASE_URL (Neon) e BLOB_READ_WRITE_TOKEN (Vercel Blob)
npm run db:push              # cria as tabelas no Neon
npm run dev                  # http://localhost:3000
```

## Estrutura

| Pasta | O que tem |
|---|---|
| `src/config/brand.config.ts` | Nome, cores e logotipo provisórios (troque aqui) |
| `src/i18n/` | Idiomas, dicionários (`messages/pt-BR.json`) e formatação de datas/números |
| `src/app/[lang]/` | Páginas, sempre sob o idioma (`/pt-BR`) |
| `src/lib/db/` | Neon + Drizzle (`schema.ts`) |
| `src/lib/storage/` | Armazenamento de mídia (Vercel Blob, trocável) |
| `public/sw.js` | Service worker (página offline) |

Contexto e decisões do projeto ficam em `_ia/`.
