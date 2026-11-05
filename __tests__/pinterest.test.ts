import { describe, expect, it } from 'vitest';
import {
  validatePinCompliance,
  PinterestRateLimiter,
  buildPinPayload,
  getPinterestApiBaseUrl,
} from '../src/utils/pinterest';

describe('pinterest integration utils (integração e compliance Pinterest API v5)', () => {
  describe('validatePinCompliance', () => {
    it('deve aprovar um Pin totalmente compatível com FTC e políticas da Amazon', () => {
      const pin = {
        title: '5 Best Orthopedic Dog Beds of 2026 for Joint Relief',
        description: 'Discover the top memory foam orthopedic dog beds recommended by vets for senior pets. #ad #affiliate',
        link: 'https://uadson.github.io/paw-and-home/articles/best-orthopedic-dog-beds',
      };

      const result = validatePinCompliance(pin);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('deve reprovar Pin que tenta linkar diretamente para a Amazon (violação de compliance)', () => {
      const directAmazonPin = {
        title: 'Great Orthopedic Dog Bed',
        description: 'Check out this dog bed on sale! #ad',
        link: 'https://www.amazon.com/dp/B089RGDQBB?tag=pawandhome-20',
      };

      const result = validatePinCompliance(directAmazonPin);
      expect(result.valid).toBe(false);
      expect(result.errors.some((err) => err.includes('Amazon direct linking'))).toBe(true);
    });

    it('deve reprovar Pin sem menção de transparência FTC (#ad ou #affiliate)', () => {
      const noDisclosurePin = {
        title: 'Top Under-Sink Organizers',
        description: 'Here are the best organizers for your kitchen cabinets.',
        link: 'https://uadson.github.io/paw-and-home/articles/best-under-sink-organizers',
      };

      const result = validatePinCompliance(noDisclosurePin);
      expect(result.valid).toBe(false);
      expect(result.errors.some((err) => err.includes('FTC disclosure'))).toBe(true);
    });

    it('deve reprovar Pin com título superior a 100 caracteres', () => {
      const longTitlePin = {
        title: 'A'.repeat(105),
        description: 'Valid description with disclosure. #ad',
        link: 'https://uadson.github.io/paw-and-home/articles/test',
      };

      const result = validatePinCompliance(longTitlePin);
      expect(result.valid).toBe(false);
      expect(result.errors.some((err) => err.includes('100 characters'))).toBe(true);
    });
  });

  describe('PinterestRateLimiter', () => {
    it('deve permitir requisições quando dentro da cota diária de 1.000 chamadas', () => {
      const limiter = new PinterestRateLimiter(1000);
      expect(limiter.canRequest()).toBe(true);
      limiter.recordRequest();
      expect(limiter.getRemaining()).toBe(999);
    });

    it('deve bloquear requisições quando a cota atinge o limite máximo', () => {
      const limiter = new PinterestRateLimiter(2);
      expect(limiter.canRequest()).toBe(true);
      limiter.recordRequest();
      expect(limiter.canRequest()).toBe(true);
      limiter.recordRequest();
      expect(limiter.canRequest()).toBe(false);
      expect(limiter.getRemaining()).toBe(0);
    });

    it('deve sinalizar aviso quando o consumo ultrapassar 90% da cota', () => {
      const limiter = new PinterestRateLimiter(100);
      for (let i = 0; i < 91; i++) {
        limiter.recordRequest();
      }
      expect(limiter.isNearQuotaLimit()).toBe(true);
    });
  });

  describe('buildPinPayload', () => {
    it('deve construir o payload compatível com Pinterest API v5 em inglês nativo e UTMs', () => {
      const payload = buildPinPayload({
        title: '5 Best Cat Water Fountains of 2026',
        description: 'Keep your feline hydrated with stainless steel, ultra-quiet pet water fountains tested for multi-cat homes.',
        slug: 'best-cat-water-fountains',
        heroImage: 'https://images.unsplash.com/photo-cat.jpg',
        category: 'Pet Care',
        boardId: '1234567890',
        siteUrl: 'https://uadson.github.io/paw-and-home',
      });

      expect(payload.board_id).toBe('1234567890');
      expect(payload.title).toBe('5 Best Cat Water Fountains of 2026');
      expect(payload.description).toContain('#ad');
      expect(payload.description).toContain('#PetCare');
      expect(payload.link).toContain('utm_source=pinterest');
      expect(payload.link).toContain('utm_medium=pin');
      expect(payload.media_source.source_type).toBe('image_url');
      expect(payload.media_source.url).toBe('https://images.unsplash.com/photo-cat.jpg');
    });
  });

  describe('getPinterestApiBaseUrl', () => {
    it('deve retornar a URL de sandbox quando o ambiente for "sandbox"', () => {
      expect(getPinterestApiBaseUrl('sandbox')).toBe('https://api-sandbox.pinterest.com/v5');
      expect(getPinterestApiBaseUrl('SANDBOX')).toBe('https://api-sandbox.pinterest.com/v5');
    });

    it('deve retornar a URL de produção por padrão', () => {
      expect(getPinterestApiBaseUrl()).toBe('https://api.pinterest.com/v5');
      expect(getPinterestApiBaseUrl('production')).toBe('https://api.pinterest.com/v5');
      expect(getPinterestApiBaseUrl('unknown')).toBe('https://api.pinterest.com/v5');
    });
  });
});
