import { describe, expect, it } from 'vitest';
import { generatePinterestFeed } from '../src/utils/feed';

describe('feed utils (gerador de feed RSS para Pinterest)', () => {
  it('deve gerar um XML RSS 2.0 válido com canais e itens formatados', () => {
    const xml = generatePinterestFeed({
      siteTitle: 'Paw & Home Guides',
      siteUrl: 'https://uadson.github.io/paw-and-home',
      siteDescription: 'Curated pet care and home organization recommendations for US households.',
      items: [
        {
          title: 'The 5 Best Orthopedic Dog Beds of 2026',
          description: 'Joint relief memory foam beds tested for senior dogs. #ad #affiliate',
          link: 'https://uadson.github.io/paw-and-home/articles/best-orthopedic-dog-beds',
          pubDate: '2026-03-01T12:00:00.000Z',
          imageUrl: 'https://images.unsplash.com/photo-bed.jpg',
          author: 'Dr. Amanda Foster',
          category: 'Pet Care',
        },
      ],
    });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('<title>Paw &amp; Home Guides</title>');
    expect(xml).toContain('<link>https://uadson.github.io/paw-and-home</link>');
    expect(xml).toContain('<item>');
    expect(xml).toContain('<title>The 5 Best Orthopedic Dog Beds of 2026</title>');
    expect(xml).toContain('<enclosure url="https://images.unsplash.com/photo-bed.jpg" type="image/jpeg" />');
    expect(xml).toContain('<category>Pet Care</category>');
  });

  it('deve tratar adequadamente caracteres especiais em títulos e descrições (escape XML)', () => {
    const xml = generatePinterestFeed({
      siteTitle: 'Paw & Home & "More"',
      siteUrl: 'https://uadson.github.io/paw-and-home',
      siteDescription: 'Tests & reviews <special>',
      items: [
        {
          title: 'Best Bowls & Feeders: Top "Picks" <2026>',
          description: 'Great for dogs & cats > all sizes',
          link: 'https://uadson.github.io/paw-and-home/articles/test',
          pubDate: new Date('2026-01-01'),
        },
      ],
    });

    expect(xml).toContain('Best Bowls &amp; Feeders: Top &quot;Picks&quot; &lt;2026&gt;');
    expect(xml).toContain('Great for dogs &amp; cats &gt; all sizes');
  });
});
