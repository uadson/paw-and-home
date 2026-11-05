/**
 * Gerador de Feed RSS compatível com Pinterest e Agregadores de Conteúdo.
 *
 * Constrói feeds RSS 2.0 estruturados contendo enclosures de imagem, tags de categoria
 * e metadados essenciais para indexação de Rich Pins e Pin Ingestion automática.
 */

export interface FeedItem {
  title: string;
  description: string;
  link: string;
  pubDate: Date | string;
  imageUrl?: string;
  author?: string;
  category?: string;
}

export interface FeedOptions {
  siteTitle: string;
  siteUrl: string;
  siteDescription: string;
  items: FeedItem[];
}

/**
 * Escapa caracteres reservados para compatibilidade estrita com XML.
 *
 * Args:
 *   unsafe: String original não tratada.
 *
 * Returns:
 *   String com entidades XML seguras (&amp;, &lt;, &gt;, &quot;, &apos;).
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Gera a string XML formatada no padrão RSS 2.0 com elementos de mídia para o Pinterest.
 *
 * Args:
 *   options: Metadados do site e lista de itens a serem incluídos no feed.
 *
 * Returns:
 *   String contendo o documento XML completo.
 */
export function generatePinterestFeed(options: FeedOptions): string {
  const { siteTitle, siteUrl, siteDescription, items } = options;

  const itemsXml = items
    .map((item) => {
      const escapedTitle = escapeXml(item.title);
      const escapedDesc = escapeXml(item.description);
      const dateStr = new Date(item.pubDate).toUTCString();
      const enclosureTag = item.imageUrl
        ? `\n      <enclosure url="${escapeXml(item.imageUrl)}" type="image/jpeg" />`
        : '';
      const categoryTag = item.category ? `\n      <category>${escapeXml(item.category)}</category>` : '';
      const authorTag = item.author ? `\n      <author>${escapeXml(item.author)}</author>` : '';

      return `    <item>
      <title>${escapedTitle}</title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.link}</guid>
      <description>${escapedDesc}</description>
      <pubDate>${dateStr}</pubDate>${enclosureTag}${categoryTag}${authorTag}
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en-US</language>
    <atom:link href="${siteUrl}/pinterest-feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;
}
