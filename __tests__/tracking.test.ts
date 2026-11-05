import { describe, expect, it } from 'vitest';
import {
  buildPinterestTagSnippet,
  formatOutboundEvent,
  generateAdUtmLink,
} from '../src/utils/tracking';

describe('tracking utils (telemetria e Pinterest Tag)', () => {
  describe('buildPinterestTagSnippet', () => {
    it('deve gerar o script do Pinterest Tag com o tagId configurado', () => {
      const tagId = '2612345678901';
      const snippet = buildPinterestTagSnippet(tagId);
      expect(snippet).toContain(tagId);
      expect(snippet).toContain('pintrk');
      expect(snippet).toContain('pintrk(\'load\'');
      expect(snippet).toContain('pintrk(\'page\'');
    });

    it('deve retornar string vazia se o tagId for inválido ou vazio', () => {
      expect(buildPinterestTagSnippet('')).toBe('');
      expect(buildPinterestTagSnippet('   ')).toBe('');
    });
  });

  describe('formatOutboundEvent', () => {
    it('deve formatar o evento de clique de saída para a Amazon com os metadados corretos', () => {
      const event = formatOutboundEvent('B089RGDQBB', 'Bedsure Orthopedic Dog Bed', {
        category: 'Pet Care',
        priceCategory: 'Value',
      });

      expect(event.eventName).toBe('OutboundClick');
      expect(event.payload.asin).toBe('B089RGDQBB');
      expect(event.payload.product_name).toBe('Bedsure Orthopedic Dog Bed');
      expect(event.payload.category).toBe('Pet Care');
      expect(event.payload.lead_type).toBe('Amazon Affiliate Outbound');
    });
  });

  describe('generateAdUtmLink', () => {
    it('deve anexar parâmetros UTM completos para campanhas e Pins do Pinterest', () => {
      const baseUrl = 'https://uadson.github.io/paw-and-home/articles/best-orthopedic-dog-beds';
      const link = generateAdUtmLink(baseUrl, {
        campaign: 'pet_spring_sale',
        medium: 'pin',
        content: 'hero_bed_pin',
      });

      expect(link).toContain('utm_source=pinterest');
      expect(link).toContain('utm_medium=pin');
      expect(link).toContain('utm_campaign=pet_spring_sale');
      expect(link).toContain('utm_content=hero_bed_pin');
    });

    it('deve preservar parâmetros existentes na URL original', () => {
      const baseUrl = 'https://uadson.github.io/paw-and-home/articles/test?preview=true';
      const link = generateAdUtmLink(baseUrl, {
        campaign: 'organizers',
      });

      expect(link).toContain('preview=true');
      expect(link).toContain('utm_source=pinterest');
      expect(link).toContain('utm_campaign=organizers');
    });
  });
});
