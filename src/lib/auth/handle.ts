// Nome de usuário (@arroba): minúsculas, números e sublinhado, de 3 a 20 caracteres.
export const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;

export function normalizeHandle(value: string) {
  return value.trim().replace(/^@/, "").toLowerCase();
}

export function isValidHandle(value: string) {
  return HANDLE_PATTERN.test(value);
}
