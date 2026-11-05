/**
 * Gerador de Criativos Visuais Verticais para Pinterest (1000x1500px - Proporção 2:3).
 *
 * Gera imagens vetoriais SVG de alta resolução, otimizadas para alto CTR no feed mobile
 * do Pinterest nos EUA, com títulos em inglês nativo, badges de teste e compliance FTC.
 */

export interface PinImageOptions {
  title: string;
  subtitle?: string;
  category: string;
  imageUrl: string;
  rating?: number;
  badgeText?: string;
  ctaText?: string;
}

/**
 * Escapa caracteres reservados para garantir XML/SVG válido.
 *
 * Args:
 *   str: Texto de entrada.
 *
 * Returns:
 *   Texto escapado com entidades XML.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Quebra um texto longo em linhas de até maxChars caracteres para exibição em SVG.
 *
 * Args:
 *   text: Texto completo.
 *   maxChars: Número máximo de caracteres por linha.
 *
 * Returns:
 *   Array com as linhas quebradas.
 */
function wrapText(text: string, maxChars: number = 28): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxChars) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Gera o documento SVG completo de 1000x1500px com design premium para o Pinterest.
 *
 * Args:
 *   options: Configurações do criativo (título, subtítulo, imagem, categoria, etc.).
 *
 * Returns:
 *   String contendo o código SVG completo.
 */
export function generateVerticalPinSvg(options: PinImageOptions): string {
  const {
    title,
    subtitle = 'Expert Tested & Verified Review',
    category,
    imageUrl,
    rating = 4.8,
    badgeText = 'Top Pick 2026',
    ctaText = 'Tap to See Full Review →',
  } = options;

  const escapedTitleLines = wrapText(title, 26).map((l) => escapeXml(l));
  const escapedSubtitle = escapeXml(subtitle);
  const escapedCategory = escapeXml(category.toUpperCase());
  const escapedBadge = escapeXml(badgeText.toUpperCase());
  const escapedCta = escapeXml(ctaText);
  const escapedImage = escapeXml(imageUrl);

  const titleTspans = escapedTitleLines
    .slice(0, 3)
    .map((line, idx) => `<tspan x="500" dy="${idx === 0 ? 0 : 54}">${line}</tspan>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1500" width="1000" height="1500">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
    <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.5" />
    </filter>
    <clipPath id="imageClip">
      <rect x="120" y="460" width="760" height="600" rx="32" ry="32" />
    </clipPath>
  </defs>

  <!-- Fundo com gradiente escuro premium -->
  <rect width="1000" height="1500" fill="url(#bgGrad)" />

  <!-- Marca & Tag de Categoria Superior -->
  <g transform="translate(0, 80)">
    <rect x="360" y="0" width="280" height="42" rx="21" fill="#334155" opacity="0.6" />
    <text x="500" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" fill="#f8fafc" letter-spacing="3" text-anchor="middle">
      PAW &amp; HOME GUIDES
    </text>
  </g>

  <!-- Badge de Destaque -->
  <g transform="translate(0, 160)">
    <rect x="375" y="0" width="250" height="44" rx="22" fill="url(#amberGrad)" />
    <text x="500" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="#0f172a" letter-spacing="2" text-anchor="middle">
      ★ ${escapedBadge}
    </text>
  </g>

  <!-- Headline Principal de Alto Impacto -->
  <text x="500" y="260" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle">
    ${titleTspans}
  </text>

  <!-- Subtítulo de Autoridade -->
  <text x="500" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="500" fill="#94a3b8" text-anchor="middle">
    ${escapedSubtitle} • ${escapedCategory}
  </text>

  <!-- Card Central do Produto com Sombra e Cantos Arredondados -->
  <g filter="url(#cardShadow)">
    <rect x="100" y="450" width="800" height="620" rx="40" fill="#ffffff" />
    <rect x="120" y="460" width="760" height="600" rx="32" fill="#f8fafc" />
    <image href="${escapedImage}" x="150" y="480" width="700" height="560" preserveAspectRatio="xMidYMid meet" clip-path="url(#imageClip)" />
  </g>

  <!-- Banner de Prova Social e Avaliações -->
  <g transform="translate(0, 1110)">
    <rect x="250" y="0" width="500" height="60" rx="30" fill="#1e293b" stroke="#334155" stroke-width="2" />
    <text x="500" y="38" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" fill="#fbbf24" text-anchor="middle">
      ★ ★ ★ ★ ★ <tspan fill="#f8fafc" font-size="18"> ${rating.toFixed(1)} / 5.0 Rating</tspan>
    </text>
  </g>

  <!-- Botão de Chamada para Ação (CTA) Chamativo -->
  <g transform="translate(0, 1220)">
    <rect x="180" y="0" width="640" height="110" rx="32" fill="url(#amberGrad)" filter="url(#cardShadow)" />
    <text x="500" y="68" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="900" fill="#0f172a" text-anchor="middle" letter-spacing="1">
      ${escapedCta}
    </text>
  </g>

  <!-- Rodapé Regulatório FTC -->
  <text x="500" y="1420" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#64748b" text-anchor="middle">
    #ad • Amazon Associates Qualifying Purchases • paw-and-home
  </text>
</svg>`;
}
