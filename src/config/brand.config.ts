// Marca provisória do produto. Tudo que identifica a marca fica aqui (ou em variáveis
// de ambiente), para poder trocar nome, cores e logotipo sem tocar nos componentes.

type Palette = {
  background: string;
  surface: string;
  ink: string;
  muted: string;
  border: string;
  primary: string; // verde menta vivo (preenchimentos; texto sobre ele é escuro)
  onPrimary: string;
  link: string; // verde profundo para texto e links (contraste AA)
  accent: string; // amarelo limão
  onAccent: string;
  secondary: string; // azul céu (hashtags, foco)
  heroFrom: string; // gradiente da vitrine: menta -> limão -> céu
  heroVia: string;
  heroTo: string;
  onHero: string;
  stripeBlue: string; // fim da faixa em gradiente do topo
};

export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "Palavra-Visual",
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME ?? "Palavra",
  logo: "/icons/logo.svg",
  themeColor: "#2BD48A",
  backgroundColor: "#F8FBF8",
  colors: {
    light: {
      background: "#F8FBF8",
      surface: "#FFFFFF",
      ink: "#0F1F2E",
      muted: "#566673",
      border: "#E2EEE6",
      primary: "#2BD48A",
      onPrimary: "#06281B",
      link: "#087A4B",
      accent: "#FFD84D",
      onAccent: "#0F1F2E",
      secondary: "#2F6BFF",
      heroFrom: "#C9F5DE",
      heroVia: "#FFF3B0",
      heroTo: "#CBE0FF",
      onHero: "#0F1F2E",
      stripeBlue: "#5B8CFF",
    },
    dark: {
      background: "#0A1410",
      surface: "#122019",
      ink: "#EEF6F1",
      muted: "#9DB5A8",
      border: "#1F3A2C",
      primary: "#34DB92",
      onPrimary: "#052B1A",
      link: "#5BE3A6",
      accent: "#FFD84D",
      onAccent: "#0F1F2E",
      secondary: "#8CB0FF",
      heroFrom: "#0F4A34",
      heroVia: "#1B4F5C",
      heroTo: "#243C86",
      onHero: "#FFFFFF",
      stripeBlue: "#5B8CFF",
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
