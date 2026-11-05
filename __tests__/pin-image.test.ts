import { describe, expect, it } from 'vitest';
import {
  generateVerticalPinSvg,
  type PinImageOptions,
} from '../src/utils/pin-image';

describe('pin-image utils (gerador de criativos verticais 1000x1500px para Pinterest)', () => {
  const sampleOptions: PinImageOptions = {
    title: 'The 5 Best Orthopedic Dog Beds of 2026',
    subtitle: 'Tested for Senior Dogs & Arthritis Relief',
    category: 'Pet Care',
    imageUrl: 'https://images.unsplash.com/photo-bed.jpg',
    rating: 4.8,
    badgeText: 'Top Pick 2026',
    ctaText: 'Tap to Read Full Guide',
  };

  it('deve gerar um SVG com as dimensões exatas de 1000x1500px (proporção vertical 2:3)', () => {
    const svg = generateVerticalPinSvg(sampleOptions);

    expect(svg).toContain('viewBox="0 0 1000 1500"');
    expect(svg).toContain('width="1000"');
    expect(svg).toContain('height="1500"');
  });

  it('deve incluir a tipografia em inglês, o badge de destaque e estrelas de avaliação', () => {
    const svg = generateVerticalPinSvg(sampleOptions);

    expect(svg).toContain('PAW &amp; HOME');
    expect(svg).toContain('The 5 Best Orthopedic Dog');
    expect(svg).toContain('Beds of 2026');
    expect(svg).toContain('TOP PICK 2026');
    expect(svg).toContain('4.8');
    expect(svg).toContain('Tap to Read Full Guide');
  });

  it('deve conter a marcação regulatória obrigatória da FTC (#ad)', () => {
    const svg = generateVerticalPinSvg(sampleOptions);
    expect(svg).toContain('#ad');
  });

  it('deve tratar adequadamente caracteres especiais em títulos para não corromper o XML', () => {
    const svg = generateVerticalPinSvg({
      ...sampleOptions,
      title: 'Top Bowls & Feeders: Best "Budget" Picks <2026>',
    });

    expect(svg).toContain('&quot;Budget&quot;');
    expect(svg).toContain('&lt;2026&gt;');
    expect(svg).toContain('Bowls &amp; Feeders');
  });
});
