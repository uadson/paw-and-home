/**
 * Utilitários para tratamento de links e conformidade de afiliados Amazon.
 *
 * Fornece métodos para extração de ASIN, higienização e construção de links
 * de afiliados canônicos com tags rastreáveis e atributos de conformidade FTC/SEO.
 */

export const DEFAULT_AMAZON_TAG = 
  (typeof process !== 'undefined' && process.env?.PUBLIC_AMAZON_AFFILIATE_TAG) ||
  'pawandhome-20';

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

export interface AffiliateUrlOptions {
  tag?: string;
  subTag?: string;
  campaign?: string;
}

/**
 * Constrói uma URL canônica e limpa de afiliado da Amazon a partir de um ASIN ou URL.
 *
 * Remove tokens de rastreamento antigos, referrers e lixo de query strings,
 * garantindo a aplicação consistente da tag de associado correta e suporte a sub-tracking (ascsubtag).
 *
 * Args:
 *   asinOrUrl: Código ASIN ou URL completa do produto na Amazon.
 *   tagOrOptions: Tag de afiliado personalizada opcional ou objeto de opções (tag, subTag, campaign).
 *   subTagParam: Sub-tag opcional para rastreamento (usado quando tagOrOptions é string).
 *
 * Returns:
 *   URL canônica de afiliado ou o link original caso o ASIN não possa ser extraído.
 */
export function buildAmazonUrl(
  asinOrUrl: string,
  tagOrOptions: string | AffiliateUrlOptions = DEFAULT_AMAZON_TAG,
  subTagParam?: string,
): string {
  const asin = extractAsin(asinOrUrl);

  if (!asin) {
    return asinOrUrl;
  }

  let tag = DEFAULT_AMAZON_TAG;
  let subTag: string | undefined = subTagParam;

  if (typeof tagOrOptions === 'string') {
    tag = tagOrOptions || DEFAULT_AMAZON_TAG;
  } else if (tagOrOptions && typeof tagOrOptions === 'object') {
    tag = tagOrOptions.tag || DEFAULT_AMAZON_TAG;
    if (tagOrOptions.subTag) {
      subTag = tagOrOptions.subTag;
    }
  }

  let url = `https://www.amazon.com/dp/${asin}?tag=${encodeURIComponent(tag)}`;
  if (subTag) {
    url += `&ascsubtag=${encodeURIComponent(subTag)}`;
  }

  return url;
}

/**
 * Constrói a URL oficial de adição direta ao carrinho da Amazon (Add to Cart).
 *
 * Ao adicionar o item diretamente ao carrinho de compras do visitante,
 * a janela de atribuição de comissão do Amazon Associates é estendida
 * de 24 horas para até 90 dias (ou até a conclusão do pedido).
 *
 * Args:
 *   asinOrUrl: Código ASIN ou URL completa do produto na Amazon.
 *   tagOrOptions: Tag de afiliado personalizada ou objeto de opções (tag, subTag).
 *   subTagParam: Sub-tag opcional para rastreamento de campanha.
 *
 * Returns:
 *   URL canônica de Add to Cart com quantidade 1 e tag de associado.
 */
export function buildAmazonAddToCartUrl(
  asinOrUrl: string,
  tagOrOptions: string | AffiliateUrlOptions = DEFAULT_AMAZON_TAG,
  subTagParam?: string,
): string {
  const asin = extractAsin(asinOrUrl);

  if (!asin) {
    return asinOrUrl;
  }

  let tag = DEFAULT_AMAZON_TAG;
  let subTag: string | undefined = subTagParam;

  if (typeof tagOrOptions === 'string') {
    tag = tagOrOptions || DEFAULT_AMAZON_TAG;
  } else if (tagOrOptions && typeof tagOrOptions === 'object') {
    tag = tagOrOptions.tag || DEFAULT_AMAZON_TAG;
    if (tagOrOptions.subTag) {
      subTag = tagOrOptions.subTag;
    }
  }

  let url = `https://www.amazon.com/gp/aws/cart/add.html?ASIN.1=${asin}&Quantity.1=1&AssociateTag=${encodeURIComponent(tag)}`;
  if (subTag) {
    url += `&ascsubtag=${encodeURIComponent(subTag)}`;
  }

  return url;
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

/**
 * Constrói a URL de afiliado para o programa de recompensa (Bounty) do Amazon Prime 30-Day Free Trial.
 *
 * A Amazon remunera o afiliado (US$ 3 a 5) quando um visitante se cadastra no período de teste gratuito.
 *
 * Args:
 *   tag: Tag de afiliado personalizada opcional.
 *
 * Returns:
 *   URL canônica de direcionamento para o cadastro do Prime com a tag de associado.
 */
export function buildPrimeTrialUrl(tag: string = DEFAULT_AMAZON_TAG): string {
  const activeTag = tag || DEFAULT_AMAZON_TAG;
  return `https://www.amazon.com/amazonprime?tag=${encodeURIComponent(activeTag)}`;
}

