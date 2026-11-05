/**
 * Utilitários para Integração com a API do Pinterest v5 e Gestão de Compliance.
 *
 * Provê controle de rate limit (Trial 1.000 requisições/dia), validação de regras da FTC
 * e do Amazon Associates, além da montagem de payloads em conformidade com o Pinterest Ads/Pins.
 */

import { generateAdUtmLink } from './tracking';

export const PINTEREST_PROD_API_URL = 'https://api.pinterest.com/v5';
export const PINTEREST_SANDBOX_API_URL = 'https://api-sandbox.pinterest.com/v5';

/**
 * Retorna o endpoint base da API do Pinterest v5 de acordo com o ambiente configurado.
 *
 * Args:
 *   env: Nome do ambiente ('production' | 'sandbox').
 *
 * Returns:
 *   A URL base oficial correspondente.
 */
export function getPinterestApiBaseUrl(env: string = 'production'): string {
  if (typeof env === 'string' && env.trim().toLowerCase() === 'sandbox') {
    return PINTEREST_SANDBOX_API_URL;
  }
  return PINTEREST_PROD_API_URL;
}

export interface PinData {
  title: string;
  description: string;
  link: string;
  boardId?: string;
  imageUrl?: string;
}

export interface PinValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ArticlePinInput {
  title: string;
  description: string;
  slug: string;
  heroImage: string;
  category: string;
  boardId: string;
  siteUrl: string;
}

export interface PinterestPinPayload {
  board_id: string;
  title: string;
  description: string;
  link: string;
  media_source: {
    source_type: 'image_url';
    url: string;
  };
}

/**
 * Valida a conformidade regulatória e estrutural de um Pin antes da publicação via API.
 *
 * Verifica proibições de direct linking para a Amazon, obrigatoriedade de disclaimer
 * da FTC (#ad/#affiliate) e limites de caracteres da API do Pinterest v5.
 *
 * Args:
 *   pin: Dados do Pin a serem validados.
 *
 * Returns:
 *   Objeto com status booleano e array contendo descrições detalhadas de inconsistências.
 */
export function validatePinCompliance(pin: PinData): PinValidationResult {
  const errors: string[] = [];

  // Verificação de Direct Linking proibido pela Amazon em anúncios externos
  const amazonPattern = /(?:amazon\.com|amzn\.to|amazon\.[a-z.]+)/i;
  if (amazonPattern.test(pin.link)) {
    errors.push('Amazon direct linking is prohibited in external ad creatives. Direct users to a bridge review page instead.');
  }

  // Verificação de conformidade FTC
  const ftcPattern = /(?:#ad|#affiliate|\baffiliate\b|\bsponsored\b)/i;
  if (!ftcPattern.test(pin.description)) {
    errors.push('Missing FTC disclosure in description. Include #ad or #affiliate to comply with US advertising regulations.');
  }

  // Verificação de limites de caracteres da Pinterest API v5
  if (!pin.title || pin.title.trim().length === 0) {
    errors.push('Pin title cannot be empty.');
  } else if (pin.title.length > 100) {
    errors.push(`Pin title exceeds Pinterest limit of 100 characters (current: ${pin.title.length}).`);
  }

  if (!pin.description || pin.description.trim().length === 0) {
    errors.push('Pin description cannot be empty.');
  } else if (pin.description.length > 500) {
    errors.push(`Pin description exceeds Pinterest limit of 500 characters (current: ${pin.description.length}).`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gerenciador de Rate Limit para a API do Pinterest (Plano Trial - 1.000 requisições/dia).
 */
export class PinterestRateLimiter {
  private maxRequests: number;
  private currentRequests: number;

  /**
   * Construtor da classe de controle de limite.
   *
   * Args:
   *   maxRequests: Número máximo de chamadas permitidas na janela (padrão: 1000).
   */
  constructor(maxRequests: number = 1000) {
    this.maxRequests = maxRequests;
    this.currentRequests = 0;
  }

  /**
   * Avalia se ainda há cota para efetuar novas chamadas de API.
   *
   * Returns:
   *   true se houver cota disponível, false caso contrário.
   */
  canRequest(): boolean {
    return this.currentRequests < this.maxRequests;
  }

  /**
   * Registra uma requisição efetuada na contagem interna.
   */
  recordRequest(): void {
    if (this.currentRequests < this.maxRequests) {
      this.currentRequests += 1;
    }
  }

  /**
   * Retorna a quantidade de requisições restantes.
   *
   * Returns:
   *   Número de requisições restantes.
   */
  getRemaining(): number {
    return Math.max(0, this.maxRequests - this.currentRequests);
  }

  /**
   * Sinaliza se o consumo atingiu 90% da cota contratada.
   *
   * Returns:
   *   true caso tenha ultrapassado 90% da cota.
   */
  isNearQuotaLimit(): boolean {
    return this.currentRequests >= this.maxRequests * 0.9;
  }

  /**
   * Reinicia a contagem de requisições.
   */
  reset(): void {
    this.currentRequests = 0;
  }
}

/**
 * Constrói o payload para publicação de Pin na API do Pinterest v5.
 *
 * Gera texto e título em inglês americano nativo, anexa tags da FTC e parâmetros UTM.
 *
 * Args:
 *   article: Dados do artigo editorial.
 *
 * Returns:
 *   Payload formatado para o endpoint POST /v5/pins.
 */
export function buildPinPayload(article: ArticlePinInput): PinterestPinPayload {
  const categoryTag = article.category.replace(/\s+/g, '');
  const cleanTitle = article.title.length > 100 ? `${article.title.slice(0, 97)}...` : article.title;

  let description = `${article.description} Read our complete in-depth guide with pros & cons. #ad #affiliate #${categoryTag}`;
  if (description.length > 500) {
    const overflow = description.length - 500;
    const truncatedDesc = article.description.slice(0, -(overflow + 3));
    description = `${truncatedDesc}... Read our complete in-depth guide with pros & cons. #ad #affiliate #${categoryTag}`;
  }

  const cleanSiteUrl = article.siteUrl.replace(/\/$/, '');
  const rawArticleUrl = `${cleanSiteUrl}/articles/${article.slug}`;
  const trackedLink = generateAdUtmLink(rawArticleUrl, {
    campaign: article.slug,
    medium: 'pin',
    source: 'pinterest',
  });

  return {
    board_id: article.boardId,
    title: cleanTitle,
    description,
    link: trackedLink,
    media_source: {
      source_type: 'image_url',
      url: article.heroImage,
    },
  };
}

/**
 * Gera 4 variações estratégicas de Pins para o mesmo artigo com ganchos psicológicos complementares.
 *
 * Cria ângulos focados em:
 * 1. Dor e alívio imediato (pain_relief);
 * 2. Custo-benefício e valor (budget_value);
 * 3. Durabilidade e qualidade de construção (durability_quality);
 * 4. Comparativo prático e recomendação de especialistas (comparison_testing).
 *
 * Args:
 *   article: Dados do artigo editorial.
 *
 * Returns:
 *   Lista com 4 payloads formatados e prontos para publicação na Pinterest API v5.
 */
export function generateMultiPinHooks(article: ArticlePinInput): PinterestPinPayload[] {
  const categoryTag = article.category.replace(/\s+/g, '');
  const cleanSiteUrl = article.siteUrl.replace(/\/$/, '');
  const rawArticleUrl = `${cleanSiteUrl}/articles/${article.slug}`;

  const hooks = [
    {
      hookId: 'hook_pain',
      title: `Need Fast Relief for Your Dog? Top ${article.category} Ranked`,
      description: `Stop letting discomfort ruin your daily routine. We tested top ${article.category.toLowerCase()} options that bring real relief. See the full review! #ad #affiliate #${categoryTag}`,
    },
    {
      hookId: 'hook_value',
      title: `Best Bang for Your Buck: Top ${article.category} of 2026`,
      description: `Don't overpay for overpriced brands. We tested affordable ${article.category.toLowerCase()} options that deliver premium quality on Amazon. #ad #affiliate #${categoryTag}`,
    },
    {
      hookId: 'hook_durability',
      title: `Built to Last: Durable & Easy-Clean ${article.category} Reviewed`,
      description: `Tired of buying replacements every 6 months? We ranked the toughest, machine-washable ${article.category.toLowerCase()} products on Amazon. #ad #affiliate #${categoryTag}`,
    },
    {
      hookId: 'hook_comparison',
      title: `Tested & Rated: Which ${article.category} is Actually Worth It?`,
      description: `We compared the top 5 contenders side-by-side to find the ultimate winner. See the specs, pros & cons before you buy! #ad #affiliate #${categoryTag}`,
    },
  ];

  return hooks.map((h) => {
    const trackedLink = generateAdUtmLink(rawArticleUrl, {
      campaign: article.slug,
      medium: 'pin',
      source: 'pinterest',
      content: h.hookId,
    });

    const cleanTitle = h.title.length > 100 ? `${h.title.slice(0, 97)}...` : h.title;
    let cleanDesc = h.description;
    if (cleanDesc.length > 500) {
      cleanDesc = `${cleanDesc.slice(0, 497)}...`;
    }

    return {
      board_id: article.boardId,
      title: cleanTitle,
      description: cleanDesc,
      link: trackedLink,
      media_source: {
        source_type: 'image_url',
        url: article.heroImage,
      },
    };
  });
}
