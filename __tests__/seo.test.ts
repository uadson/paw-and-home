import { describe, expect, it } from 'vitest';
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildProductSchema,
  buildFaqSchema,
} from '../src/utils/seo';

describe('seo utils (utilitários de SEO e Schema Markup)', () => {
  describe('buildArticleSchema', () => {
    it('deve gerar Schema.org válido para Article / BlogPosting', () => {
      const article = {
        title: 'Best Cat Water Fountains of 2026',
        description: 'Discover the top whisper-quiet stainless steel pet fountains.',
        url: 'https://uadson.github.io/amazon-affiliate-niche-site/articles/best-cat-water-fountains',
        publishDate: new Date('2026-03-01'),
        author: 'Vet Care Editorial Team',
        image: 'https://uadson.github.io/amazon-affiliate-niche-site/images/cat-fountain.jpg',
      };

      const schema = buildArticleSchema(article);
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Article');
      expect(schema.headline).toBe(article.title);
      expect(schema.description).toBe(article.description);
      expect(schema.author['@type']).toBe('Person');
      expect(schema.author.name).toBe(article.author);
      expect(schema.datePublished).toBe('2026-03-01T00:00:00.000Z');
    });
  });

  describe('buildProductSchema', () => {
    it('deve gerar Schema.org válido para Produto e Review', () => {
      const product = {
        name: 'PetSafe Drinkwell Stainless Multi-Tier Pet Fountain',
        description: 'Dual-tier fountain suitable for cats and dogs.',
        image: 'https://m.media-amazon.com/images/I/71example.jpg',
        asin: 'B0056ASTDU',
        rating: 4.8,
        reviewCount: 1240,
        brand: 'PetSafe',
      };

      const schema = buildProductSchema(product);
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Product');
      expect(schema.name).toBe(product.name);
      expect(schema.sku).toBe(product.asin);
      expect(schema.brand?.name).toBe('PetSafe');
      expect(schema.aggregateRating?.ratingValue).toBe(4.8);
      expect(schema.aggregateRating?.reviewCount).toBe(1240);
    });
  });

  describe('buildBreadcrumbSchema', () => {
    it('deve gerar Schema.org BreadcrumbList com a hierarquia correta', () => {
      const items = [
        { name: 'Home', url: 'https://uadson.github.io/amazon-affiliate-niche-site/' },
        { name: 'Pet Care', url: 'https://uadson.github.io/amazon-affiliate-niche-site/category/pet-care' },
        { name: 'Best Cat Water Fountains', url: 'https://uadson.github.io/amazon-affiliate-niche-site/articles/best-cat-water-fountains' },
      ];

      const schema = buildBreadcrumbSchema(items);
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(3);
      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[0].name).toBe('Home');
      expect(schema.itemListElement[2].position).toBe(3);
    });
  });

  describe('buildFaqSchema', () => {
    it('deve gerar Schema.org FAQPage com pares de pergunta e resposta aceitos pelo Google', () => {
      const faqs = [
        { question: 'How often should I clean the fountain?', answer: 'Every 5 to 7 days.' },
        { question: 'Do cat water fountains use a lot of electricity?', answer: 'No, only 1.5 to 2.5 watts.' },
      ];

      const schema = buildFaqSchema(faqs);
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('FAQPage');
      const entities = schema.mainEntity as Array<{ '@type': string; name: string; acceptedAnswer: { text: string } }>;
      expect(entities).toHaveLength(2);
      expect(entities[0]['@type']).toBe('Question');
      expect(entities[0].name).toBe('How often should I clean the fountain?');
      expect(entities[0].acceptedAnswer.text).toBe('Every 5 to 7 days.');
    });
  });
});
