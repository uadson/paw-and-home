import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('IndexNow Configuration & Payload', () => {
  const INDEXNOW_KEY = 'c78e3489b91040f9b6917bce7d6ef621';
  const HOST = 'uadson.github.io';
  const BASE_URL = 'https://uadson.github.io/paw-and-home';

  it('deve possuir o arquivo de validação de chave na pasta public/', () => {
    const keyFilePath = path.resolve(process.cwd(), `public/${INDEXNOW_KEY}.txt`);
    expect(fs.existsSync(keyFilePath)).toBe(true);

    const fileContent = fs.readFileSync(keyFilePath, 'utf-8').trim();
    expect(fileContent).toBe(INDEXNOW_KEY);
  });

  it('deve gerar URLs absolutas válidas para todos os artigos publicados', () => {
    const articlesDir = path.resolve(process.cwd(), 'src/content/articles');
    const articleFiles = fs.readdirSync(articlesDir).filter((file) => file.endsWith('.mdx'));

    expect(articleFiles.length).toBeGreaterThan(0);

    const urls = articleFiles.map((file) => {
      const slug = file.replace(/\.mdx$/, '');
      return `${BASE_URL}/articles/${slug}/`;
    });

    for (const url of urls) {
      expect(url).toMatch(/^https:\/\/uadson\.github\.io\/paw-and-home\/articles\/[a-z0-9-]+\/$/);
    }
  });

  it('deve estruturar o payload do IndexNow conforme a especificação oficial', () => {
    const sampleUrls = [
      `${BASE_URL}/`,
      `${BASE_URL}/articles/best-under-sink-organizers/`,
    ];

    const payload = {
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: sampleUrls,
    };

    expect(payload.host).toBe('uadson.github.io');
    expect(payload.key).toBe(INDEXNOW_KEY);
    expect(payload.keyLocation).toBe(`${BASE_URL}/${INDEXNOW_KEY}.txt`);
    expect(payload.urlList).toHaveLength(2);
    expect(payload.urlList[0]).toBe('https://uadson.github.io/paw-and-home/');
  });

  it('deve retornar todas as URLs incluindo páginas institucionais e artigos via getAllSiteUrls', async () => {
    const { getAllSiteUrls } = await import('../scripts/notify-indexnow.mjs');
    const urls = getAllSiteUrls();

    expect(urls).toContain('https://uadson.github.io/paw-and-home/');
    expect(urls).toContain('https://uadson.github.io/paw-and-home/disclosure/');
    expect(urls).toContain('https://uadson.github.io/paw-and-home/privacy/');
    expect(urls.some((u: string) => u.includes('/articles/'))).toBe(true);
  });
});
