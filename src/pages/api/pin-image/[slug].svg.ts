import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { generateVerticalPinSvg } from '../../../utils/pin-image';

export async function getStaticPaths() {
  const articles = await getCollection('articles');
  return articles.map((article) => ({
    params: { slug: article.id },
    props: { article },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { article } = props;

  const svg = generateVerticalPinSvg({
    title: article.data.title,
    subtitle: article.data.description,
    category: article.data.category,
    imageUrl: article.data.heroImage || 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=1200',
    rating: article.data.rating || 4.8,
    badgeText: 'Tested & Top Rated',
    ctaText: 'Tap to See Top Picks →',
  });

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
