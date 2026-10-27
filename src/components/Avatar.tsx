type Props = { displayName: string; avatarUrl?: string | null; size?: number; className?: string };

/** Foto de perfil, ou a inicial do nome sobre o degradê da marca. Decorativo (o nome vem ao lado). */
export function Avatar({ displayName, avatarUrl, size = 40, className = "" }: Props) {
  const style = { width: size, height: size };
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- foto do usuário vinda do Blob
      <img
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        style={style}
        className={`shrink-0 rounded-full bg-line object-cover ${className}`}
      />
    );
  }
  const initial = Array.from(displayName.trim())[0]?.toUpperCase() ?? "?";
  return (
    <span
      aria-hidden="true"
      style={{ ...style, fontSize: size * 0.42 }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary via-accent to-stripe-blue font-display font-bold text-on-primary ${className}`}
    >
      {initial}
    </span>
  );
}
