/**
 * Logo da CantiNet: uma tigela (comida) com arcos de sinal (rede/pedido online).
 * Desenho original, em SVG, sem dependências.
 */
export function Logo({ tamanho = 48 }: { tamanho?: number }) {
  return (
    <svg
      className="marca-logo"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Logo da CantiNet"
    >
      <defs>
        <linearGradient id="cantinet-fundo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a3d82" />
          <stop offset="1" stopColor="#0a1f4a" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#cantinet-fundo)" />
      <g fill="none" stroke="#ff8f3d" strokeWidth="4" strokeLinecap="round">
        <path d="M25 34 A7 7 0 0 1 39 34" />
        <path d="M19 34 A13 13 0 0 1 45 34" />
        <path d="M13 34 A19 19 0 0 1 51 34" />
      </g>
      <circle cx="32" cy="34" r="2.6" fill="#ff8f3d" />
      <path d="M12 39 H52 C52 49 43 55 32 55 C21 55 12 49 12 39 Z" fill="#ffffff" />
      <rect x="23" y="55" width="18" height="4" rx="2" fill="#ffffff" />
    </svg>
  );
}
