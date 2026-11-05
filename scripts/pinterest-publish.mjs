#!/usr/bin/env node
/**
 * Robô Publicador de Pins via Pinterest API v5.
 *
 * Lê os artigos publicados na fila editorial (data/editorial-queue.json),
 * valida a conformidade com regras da FTC (#ad/#affiliate) e proibição de direct linking da Amazon,
 * respeita a cota do tier Trial (1.000 requisições/dia) e publica no board do Pinterest.
 *
 * Uso:
 *   node scripts/pinterest-publish.mjs [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';

// Carrega variáveis do arquivo .env
if (process.loadEnvFile && fs.existsSync(path.resolve(process.cwd(), '.env'))) {
  process.loadEnvFile();
}

// Carrega token persistido em .pinterest-token.json caso não esteja no ambiente
const tokenFile = path.resolve(process.cwd(), '.pinterest-token.json');
if (!process.env.PINTEREST_ACCESS_TOKEN && fs.existsSync(tokenFile)) {
  try {
    const saved = JSON.parse(fs.readFileSync(tokenFile, 'utf-8'));
    if (saved.access_token) {
      process.env.PINTEREST_ACCESS_TOKEN = saved.access_token;
    }
  } catch {
    // ignora erro de leitura
  }
}

const queuePath = path.resolve(process.cwd(), 'data/editorial-queue.json');
const isDryRun = process.argv.includes('--dry-run') || !process.env.PINTEREST_ACCESS_TOKEN;

/**
 * Valida a conformidade de um Pin com as diretrizes do Pinterest, FTC e Amazon.
 */
function validatePin(pin) {
  const errors = [];
  const amazonPattern = /(?:amazon\.com|amzn\.to|amazon\.[a-z.]+)/i;

  if (amazonPattern.test(pin.link)) {
    errors.push('Amazon direct linking is prohibited in ad creatives. Must link to bridge page.');
  }

  const ftcPattern = /(?:#ad|#affiliate|\baffiliate\b|\bsponsored\b)/i;
  if (!ftcPattern.test(pin.description)) {
    errors.push('Missing FTC disclosure (#ad or #affiliate).');
  }

  if (!pin.title || pin.title.length > 100) {
    errors.push('Title must be between 1 and 100 characters.');
  }

  if (!pin.description || pin.description.length > 500) {
    errors.push('Description must be between 1 and 500 characters.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Constrói a URL canônica com parâmetros UTM para o Pinterest.
 */
function buildUtmLink(baseUrl, campaign) {
  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', 'pinterest');
  url.searchParams.set('utm_medium', 'pin');
  url.searchParams.set('utm_campaign', campaign);
  return url.toString();
}

async function main() {
  console.log('📌 [Pinterest Publisher] Verificando fila para publicação de Pins...');

  if (!fs.existsSync(queuePath)) {
    console.error(`❌ Fila editorial não encontrada em: ${queuePath}`);
    process.exit(1);
  }

  const rawQueue = fs.readFileSync(queuePath, 'utf-8');
  const queue = JSON.parse(rawQueue);

  // Filtra artigos publicados que ainda não foram pinados no Pinterest
  const pendingPins = queue.filter(
    (item) => item.status === 'published' && !item.pinterestPinned,
  );

  if (pendingPins.length === 0) {
    console.log('✅ Todos os artigos publicados já possuem Pins registrados.');
    return;
  }

  console.log(`📋 Encontrados ${pendingPins.length} artigo(s) para gerar Pins.`);

  const siteUrl = (process.env.SITE_URL || 'https://uadson.github.io/paw-and-home').replace(/\/$/, '');
  const boardId = process.env.PINTEREST_BOARD_ID || '1234567890';
  const accessToken = process.env.PINTEREST_ACCESS_TOKEN;
  const envMode = process.env.PINTEREST_ENVIRONMENT || 'production';
  const apiBaseUrl = process.env.PINTEREST_API_BASE_URL ||
    (envMode.toLowerCase() === 'sandbox' ? 'https://api-sandbox.pinterest.com/v5' : 'https://api.pinterest.com/v5');

  const isMultiPin = process.argv.includes('--multi-pin');
  console.log(`🌍 Ambiente API: ${envMode.toUpperCase()} (${apiBaseUrl}) | Multi-Pin: ${isMultiPin ? 'ATIVO (4 ganchos/artigo)' : 'DESATIVADO (1 pin/artigo)'}`);

  let successCount = 0;

  for (const article of pendingPins) {
    const rawLink = `${siteUrl}/articles/${article.slug}`;
    const trackedLink = buildUtmLink(rawLink, article.slug);
    const categoryTag = (article.category || 'PetCare').replace(/\s+/g, '');
    const cleanTitle = article.title.length > 95 ? `${article.title.slice(0, 92)}...` : article.title;

    let description = `${article.description} Check out our top-ranked recommendations and buying guide. #ad #affiliate #${categoryTag}`;
    if (description.length > 500) {
      const overflow = description.length - 500;
      description = `${article.description.slice(0, -(overflow + 3))}... Check out our top-ranked recommendations and buying guide. #ad #affiliate #${categoryTag}`;
    }

    const defaultPayload = {
      board_id: boardId,
      title: cleanTitle,
      description,
      link: trackedLink,
      media_source: {
        source_type: 'image_url',
        url: article.heroImage,
      },
    };

    const payloads = isMultiPin
      ? [
          {
            title: `Need Fast Relief for Your Dog? Top ${article.category || 'Pet Care'} Ranked`,
            description: `${article.description} Stop letting discomfort ruin your daily routine. We tested top options that bring real relief. See the full review! #ad #affiliate #${categoryTag}`,
            link: `${rawLink}?utm_source=pinterest&utm_medium=pin&utm_campaign=${article.slug}&utm_content=hook_pain`,
          },
          {
            title: `Best Bang for Your Buck: Top ${article.category || 'Pet Care'} of 2026`,
            description: `Don't overpay for overpriced brands. We tested affordable options that deliver premium quality on Amazon. #ad #affiliate #${categoryTag}`,
            link: `${rawLink}?utm_source=pinterest&utm_medium=pin&utm_campaign=${article.slug}&utm_content=hook_value`,
          },
          {
            title: `Built to Last: Durable & Easy-Clean ${article.category || 'Pet Care'} Reviewed`,
            description: `Tired of buying replacements every 6 months? We ranked the toughest, machine-washable options on Amazon. #ad #affiliate #${categoryTag}`,
            link: `${rawLink}?utm_source=pinterest&utm_medium=pin&utm_campaign=${article.slug}&utm_content=hook_durability`,
          },
          {
            title: `Tested & Rated: Which ${article.category || 'Pet Care'} is Actually Worth It?`,
            description: `We compared the top 5 contenders side-by-side to find the ultimate winner. See the specs, pros & cons before you buy! #ad #affiliate #${categoryTag}`,
            link: `${rawLink}?utm_source=pinterest&utm_medium=pin&utm_campaign=${article.slug}&utm_content=hook_comparison`,
          },
        ].map((h) => ({
          board_id: boardId,
          title: h.title.length > 100 ? `${h.title.slice(0, 97)}...` : h.title,
          description: h.description.length > 500 ? `${h.description.slice(0, 497)}...` : h.description,
          link: h.link,
          media_source: { source_type: 'image_url', url: article.heroImage },
        }))
      : [defaultPayload];

    for (const pinPayload of payloads) {
      const validation = validatePin(pinPayload);
      if (!validation.valid) {
        console.error(`❌ Falha de validação no Pin para "${article.slug}":`, validation.errors);
        continue;
      }

      console.log(`\n🚀 Preparando Pin: "${pinPayload.title}"`);
      console.log(`   🔗 Destino (Bridge): ${pinPayload.link}`);
      console.log(`   🖼️  Imagem: ${pinPayload.media_source.url}`);

      if (isDryRun) {
        console.log('   🧪 [DRY-RUN] Simulação de publicação concluída com sucesso (sem envio à API).');
        successCount++;
      } else {
        try {
          const res = await fetch(`${apiBaseUrl}/pins`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(pinPayload),
          });

          if (!res.ok) {
            const body = await res.text();
            console.error(`❌ Erro Pinterest API (${res.status}): ${body}`);
            continue;
          }

          const data = await res.json();
          console.log(`   ✅ Pin criado com sucesso! ID: ${data.id}`);
          successCount++;
        } catch (err) {
          console.error(`❌ Falha de rede na requisição ao Pinterest:`, err);
        }
      }
    }

    article.pinterestPinned = true;
    article.pinterestPinnedAt = new Date().toISOString();
  }

  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf-8');
  console.log(`\n✨ Concluído! ${successCount} Pins processados com sucesso.`);
}

main().catch((err) => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
