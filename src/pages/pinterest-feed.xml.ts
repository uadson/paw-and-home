import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { generatePinterestFeed } from '../utils/feed';

export const GET: APIRoute = async (context) => {
  const articles = await getCollection('articles');

  const sortedArticles = [...articles].sort(
    (a, b) => new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime(),
  );

  const siteUrl = context.site
    ? context.site.toString().replace(/\/$/, '')
    : 'https://uadson.github.io/paw-and-home';

  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');

  const items = sortedArticles.map((article) => {
    const articleLink = `${siteUrl}${baseUrl}/articles/${article.id}`;
    return {
      title: article.data.title,
      description: article.data.description,
      link: articleLink,
      pubDate: article.data.publishDate,
      imageUrl: article.data.heroImage,
      author: article.data.author,
      category: article.data.category,
    };
  });

  const xml = generatePinterestFeed({
    siteTitle: 'Paw & Home Guides',
    siteUrl: `${siteUrl}${baseUrl}`,
    siteDescription: 'Expert-tested pet care and home organization recommendations for US consumers.',
    items,
  });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
