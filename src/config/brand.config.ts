// Marca provisória do produto. Tudo que identifica a marca fica aqui (ou em variáveis
// de ambiente), para poder trocar nome, cores e logotipo sem tocar nos componentes.

type Palette = {
  background: string;
  surface: string;
  ink: string;
  muted: string;
  border: string;
  primary: string; // verde mata
  onPrimary: string;
  accent: string; // amarelo ipê
  onAccent: string;
  secondary: string; // azul rio
};

export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "Palavra-Visual",
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME ?? "Palavra",
  logo: "/icons/logo.svg",
  themeColor: "#0A7B4F",
  backgroundColor: "#FBFAF6",
  colors: {
    light: {
      background: "#FBFAF6",
      surface: "#FFFFFF",
      ink: "#14201A",
      muted: "#5B6B62",
      border: "#E4E2D8",
      primary: "#0A7B4F",
      onPrimary: "#FFFFFF",
      accent: "#F6B400",
      onAccent: "#14201A",
      secondary: "#1F57C3",
    },
    dark: {
      background: "#0E1512",
      surface: "#16201B",
      ink: "#EEF3EF",
      muted: "#9DB0A5",
      border: "#26332C",
      primary: "#34C98A",
      onPrimary: "#0E1512",
      accent: "#F6B400",
      onAccent: "#14201A",
      secondary: "#6C9BFF",
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
