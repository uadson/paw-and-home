/**
 * Utilitários para geração de metadados de SEO e Schema Markup (JSON-LD).
 *
 * Otimizado para os requisitos do Google US Rich Snippets e diretrizes Schema.org.
 */

export interface ArticleSchemaInput {
  title: string;
  description: string;
  url: string;
  publishDate: Date | string;
  updatedDate?: Date | string;
  author: string;
  image?: string;
}

export interface ProductSchemaInput {
  name: string;
  description: string;
  image: string;
  asin?: string;
  rating?: number;
  reviewCount?: number;
  brand?: string;
  priceCurrency?: string;
  availability?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Constrói os dados estruturados no formato Schema.org Article para páginas de review.
 *
 * Args:
 *   input: Dados do artigo contendo título, descrição, autor e datas.
 *
 * Returns:
 *   Objeto pronto para serialização em script application/ld+json.
 */
export function buildArticleSchema(input: ArticleSchemaInput): Record<string, unknown> {
  const publishIso = new Date(input.publishDate).toISOString();
  const modifiedIso = input.updatedDate ? new Date(input.updatedDate).toISOString() : publishIso;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': input.url,
    },
    datePublished: publishIso,
    dateModified: modifiedIso,
    author: {
      '@type': 'Person',
      name: input.author,
    },
  };

  if (input.image) {
    schema.image = [input.image];
  }

  return schema;
}

/**
 * Constrói dados estruturados no formato Schema.org Product para cartões de produtos.
 *
 * Permite que o Google exiba rich snippets com estrelas de avaliação nos resultados de busca.
 *
 * Args:
 *   input: Dados do produto incluindo nome, asin, marca e nota de avaliação.
 *
 * Returns:
 *   Objeto compatível com Schema.org Product.
 */
export function buildProductSchema(input: ProductSchemaInput): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    image: input.image,
  };

  if (input.asin) {
    schema.sku = input.asin;
  }

  if (input.brand) {
    schema.brand = {
      '@type': 'Brand',
      name: input.brand,
    };
  }

  if (input.rating && input.rating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: input.rating,
      reviewCount: input.reviewCount || 1,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

/**
 * Constrói dados estruturados no formato BreadcrumbList.
 *
 * Args:
 *   items: Lista ordenada de itens da trilha de navegação (breadcrumb).
 *
 * Returns:
 *   Objeto compatível com Schema.org BreadcrumbList.
 */
export function buildBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Constrói dados estruturados no formato FAQPage Schema.org para perguntas frequentes.
 *
 * Permite que os snippets de perguntas e respostas apareçam diretamente no Google US.
 *
 * Args:
 *   items: Lista de perguntas e respostas.
 *
 * Returns:
 *   Objeto compatível com Schema.org FAQPage.
 */
export function buildFaqSchema(items: FaqItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

