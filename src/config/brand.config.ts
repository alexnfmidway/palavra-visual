// Marca provisória do produto. Tudo que identifica a marca fica aqui (ou em variáveis
// de ambiente), para poder trocar nome, cores e logotipo sem tocar nos componentes.

type Palette = {
  background: string;
  surface: string;
  ink: string;
  muted: string;
  border: string;
  primary: string; // verde bandeira
  onPrimary: string;
  accent: string; // amarelo ouro
  onAccent: string;
  secondary: string; // azul céu (foco, links)
  hero: string; // verde da vitrine: igual no claro e no escuro
  onHero: string;
  flagBlue: string; // azul da faixa tricolor
};

export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "Palavra-Visual",
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME ?? "Palavra",
  logo: "/icons/logo.svg",
  themeColor: "#00843D",
  backgroundColor: "#F4FAF5",
  colors: {
    light: {
      background: "#F4FAF5",
      surface: "#FFFFFF",
      ink: "#0B1F33",
      muted: "#4F5F6E",
      border: "#D6E8DB",
      primary: "#00843D",
      onPrimary: "#FFFFFF",
      accent: "#FFDF00",
      onAccent: "#002776",
      secondary: "#1D4FB8",
      hero: "#00843D",
      onHero: "#FFFFFF",
      flagBlue: "#002776",
    },
    dark: {
      background: "#07140E",
      surface: "#0F2018",
      ink: "#EEF6F0",
      muted: "#9DB8A8",
      border: "#1E3A2B",
      primary: "#2FD073",
      onPrimary: "#07140E",
      accent: "#FFDF00",
      onAccent: "#002776",
      secondary: "#7FA6FF",
      hero: "#00843D",
      onHero: "#FFFFFF",
      flagBlue: "#002776",
    },
  } satisfies Record<"light" | "dark", Palette>,
} as const;

function vars(palette: Palette) {
  return Object.entries(palette)
    .map(([key, value]) => `--brand-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${value}`)
    .join(";");
}

/** CSS com as variáveis da marca (claro e escuro), injetado uma vez no layout. */
export function brandCss() {
  return `:root{${vars(brand.colors.light)}}@media (prefers-color-scheme:dark){:root{${vars(brand.colors.dark)}}}`;
}
