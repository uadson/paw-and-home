/**
 * Utilitários para tratamento de links e conformidade de afiliados Amazon.
 *
 * Fornece métodos para extração de ASIN, higienização e construção de links
 * de afiliados canônicos com tags rastreáveis e atributos de conformidade FTC/SEO.
 */

export const DEFAULT_AMAZON_TAG = 
  (typeof process !== 'undefined' && process.env?.PUBLIC_AMAZON_AFFILIATE_TAG) ||
  'nichehub-20';

const ASIN_REGEX = /(?:dp\/|gp\/product\/|asin\/|(?:\/|^))([A-Z0-9]{10})(?:[/?&]|$)/i;

/**
 * Extrai o código ASIN (Amazon Standard Identification Number) de 10 caracteres.
 *
 * Args:
 *   input: String contendo o código ASIN direto ou uma URL completa da Amazon.
 *
 * Returns:
 *   O ASIN de 10 caracteres em caixa alta ou null caso não encontrado.
 */
export function extractAsin(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();

  // Verifica se a string já é exatamente um código ASIN de 10 caracteres alfanuméricos
  if (/^[A-Z0-9]{10}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // Tenta extrair da URL
  const match = trimmed.match(ASIN_REGEX);
  if (match && match[1]) {
    return match[1].toUpperCase();
  }

  return null;
}

/**
 * Constrói uma URL canônica e limpa de afiliado da Amazon a partir de um ASIN ou URL.
 *
 * Remove tokens de rastreamento antigos, referrers e lixo de query strings,
 * garantindo a aplicação consistente da tag de associado correta.
 *
 * Args:
 *   asinOrUrl: Código ASIN ou URL completa do produto na Amazon.
 *   tag: Tag de afiliado personalizada opcional (usa DEFAULT_AMAZON_TAG por padrão).
 *
 * Returns:
 *   URL canônica de afiliado ou o link original caso o ASIN não possa ser extraído.
 */
export function buildAmazonUrl(asinOrUrl: string, tag: string = DEFAULT_AMAZON_TAG): string {
  const asin = extractAsin(asinOrUrl);

  if (!asin) {
    return asinOrUrl;
  }

  const activeTag = tag || DEFAULT_AMAZON_TAG;
  return `https://www.amazon.com/dp/${asin}?tag=${encodeURIComponent(activeTag)}`;
}

/**
 * Retorna os atributos 'rel' recomendados para links de afiliados.
 *
 * Cumpre as diretrizes do Google Search Central para links patrocinados
 * (sponsored, nofollow) e protege contra exploits de aba (noopener).
 *
 * Returns:
 *   A string de atributos rel apropriada.
 */
export function getAffiliateRel(): string {
  return 'nofollow noopener sponsored';
}

/**
 * Retorna o texto padrão de transparência de afiliado (FTC Disclosure).
 *
 * Obrigatório pelas diretrizes da Federal Trade Commission (FTC) dos EUA e
 * pelo Amazon Associates Operating Agreement.
 *
 * Returns:
 *   Texto em inglês para exibição aos visitantes do mercado americano.
 */
export function getFtcDisclosure(): string {
  return 'As an Amazon Associate, we earn from qualifying purchases. When you purchase through links on our site, we may earn an affiliate commission at no additional cost to you. Pricing and availability are subject to change on Amazon.';
}
