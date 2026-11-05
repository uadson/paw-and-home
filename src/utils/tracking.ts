/**
 * Utilitários de Rastreamento, Telemetria e Integração do Pinterest Tag.
 *
 * Fornece métodos para inicialização do pixel do Pinterest, formatação de eventos
 * de saída para a Amazon e geração de URLs enriquecidas com UTMs para anúncios e Pins.
 */

export interface TrackingOptions {
  source?: string;
  medium?: string;
  campaign: string;
  content?: string;
  term?: string;
}

export interface OutboundOptions {
  category?: string;
  priceCategory?: string;
  position?: number;
}

export interface OutboundEventResult {
  eventName: string;
  payload: {
    asin: string;
    product_name: string;
    lead_type: string;
    category?: string;
    price_category?: string;
    position?: number;
    timestamp: string;
  };
}

/**
 * Gera o snippet JavaScript seguro para injeção do Pinterest Tag (pintrk).
 *
 * Args:
 *   tagId: O ID numérico da tag fornecido pelo Pinterest Ads Manager.
 *
 * Returns:
 *   O script pronto para renderização ou string vazia se o ID for inválido.
 */
export function buildPinterestTagSnippet(tagId: string): string {
  if (!tagId || !tagId.trim()) {
    return '';
  }

  const cleanId = tagId.trim();

  return `!function(e){if(!window.pintrk){window.pintrk = function () {
window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
  n=window.pintrk;n.queue=[],n.version="3.0";var
  t=document.createElement("script");t.async=!0,t.src=e;var
  r=document.getElementsByTagName("script")[0];
  r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
pintrk('load', '${cleanId}');
pintrk('page');`;
}

/**
 * Formata os dados de telemetria do evento de clique de saída para a Amazon.
 *
 * Args:
 *   asin: O código ASIN do produto.
 *   productName: O nome do produto anunciado.
 *   options: Metadados contextuais adicionais (categoria, faixa de preço).
 *
 * Returns:
 *   Objeto contendo o nome do evento e o payload estruturado para envio ao Pinterest e analytics.
 */
export function formatOutboundEvent(
  asin: string,
  productName: string,
  options: OutboundOptions = {},
): OutboundEventResult {
  return {
    eventName: 'OutboundClick',
    payload: {
      asin,
      product_name: productName,
      lead_type: 'Amazon Affiliate Outbound',
      category: options.category,
      price_category: options.priceCategory,
      position: options.position,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Anexa parâmetros UTM a uma URL para rastreamento de campanhas de anúncios ou Pins.
 *
 * Args:
 *   baseUrl: A URL base do artigo ou landing page.
 *   options: Parâmetros de campanha (source padrão: 'pinterest', medium padrão: 'pin').
 *
 * Returns:
 *   A URL canônica com parâmetros de rastreamento devidamente codificados.
 */
export function generateAdUtmLink(baseUrl: string, options: TrackingOptions): string {
  const url = new URL(baseUrl);
  const source = options.source || 'pinterest';
  const medium = options.medium || 'pin';

  url.searchParams.set('utm_source', source);
  url.searchParams.set('utm_medium', medium);
  url.searchParams.set('utm_campaign', options.campaign);

  if (options.content) {
    url.searchParams.set('utm_content', options.content);
  }

  if (options.term) {
    url.searchParams.set('utm_term', options.term);
  }

  return url.toString();
}
