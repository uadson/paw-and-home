import { describe, expect, it } from 'vitest';
import {
  buildAmazonUrl,
  extractAsin,
  getAffiliateRel,
  getFtcDisclosure,
  DEFAULT_AMAZON_TAG,
} from '../src/utils/affiliate';

describe('affiliate utils (utilitários de afiliado)', () => {
  describe('extractAsin', () => {
    it('deve extrair o ASIN de 10 caracteres diretamente de uma string de ASIN', () => {
      const asin = 'B0056ASTDU';
      expect(extractAsin(asin)).toBe('B0056ASTDU');
    });

    it('deve extrair o ASIN de uma URL completa com /dp/ASIN', () => {
      const url = 'https://www.amazon.com/PetSafe-Drinkwell-Multi-Tier-Fountain/dp/B0056ASTDU/ref=sr_1_1';
      expect(extractAsin(url)).toBe('B0056ASTDU');
    });

    it('deve extrair o ASIN de uma URL com /gp/product/ASIN', () => {
      const url = 'https://www.amazon.com/gp/product/B08N5WRWNW?ref=ppx_pt2_dt_b_prod_image';
      expect(extractAsin(url)).toBe('B08N5WRWNW');
    });

    it('deve retornar null se não encontrar um ASIN válido', () => {
      const invalid = 'https://www.example.com/not-amazon';
      expect(extractAsin(invalid)).toBeNull();
    });
  });

  describe('buildAmazonUrl', () => {
    it('deve gerar a URL canônica com a tag padrão a partir de um ASIN puro', () => {
      const asin = 'B0056ASTDU';
      const result = buildAmazonUrl(asin);
      expect(result).toBe(`https://www.amazon.com/dp/B0056ASTDU?tag=${DEFAULT_AMAZON_TAG}`);
    });

    it('deve gerar a URL canônica com uma tag customizada', () => {
      const asin = 'B0056ASTDU';
      const customTag = 'custom-tracker-20';
      const result = buildAmazonUrl(asin, customTag);
      expect(result).toBe(`https://www.amazon.com/dp/B0056ASTDU?tag=custom-tracker-20`);
    });

    it('deve limpar parâmetros antigos e ref ao receber URL completa', () => {
      const url = 'https://www.amazon.com/dp/B0056ASTDU?oldtag=bad-20&ref=tracking_junk';
      const result = buildAmazonUrl(url);
      expect(result).toBe(`https://www.amazon.com/dp/B0056ASTDU?tag=${DEFAULT_AMAZON_TAG}`);
    });

    it('deve retornar a URL original caso não consiga extrair ASIN', () => {
      const fallbackUrl = 'https://www.amazon.com/bestsellers';
      const result = buildAmazonUrl(fallbackUrl);
      expect(result).toBe(fallbackUrl);
    });
  });

  describe('getAffiliateRel', () => {
    it('deve retornar nofollow noopener sponsored para compliance de SEO e FTC', () => {
      expect(getAffiliateRel()).toBe('nofollow noopener sponsored');
    });
  });

  describe('getFtcDisclosure', () => {
    it('deve retornar o texto padrão de conformidade com a FTC da Amazon', () => {
      const disclosure = getFtcDisclosure();
      expect(disclosure).toContain('Amazon Associate');
      expect(disclosure).toContain('qualifying purchases');
    });
  });
});
