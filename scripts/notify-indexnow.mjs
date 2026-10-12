#!/usr/bin/env node

/**
 * @fileoverview Notifica motores de busca (Bing, Yandex, etc.) via protocolo IndexNow.
 *
 * Envia uma requisição HTTP POST com as URLs atualizadas do site para acelerar
 * a indexação nos mecanismos de busca participantes em questão de minutos.
 */

import fs from 'node:fs';
import path from 'node:path';

const INDEXNOW_KEY = 'c78e3489b91040f9b6917bce7d6ef621';
const HOST = 'uadson.github.io';
const BASE_URL = 'https://uadson.github.io/paw-and-home';
const KEY_LOCATION = `${BASE_URL}/${INDEXNOW_KEY}.txt`;

const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
];

/**
 * Coleta todas as URLs públicas do site para submissão ao IndexNow.
 *
 * @returns {string[]} Lista de URLs absolutas.
 */
export function getAllSiteUrls() {
  const urls = [
    `${BASE_URL}/`,
    `${BASE_URL}/disclosure/`,
    `${BASE_URL}/privacy/`,
  ];

  const articlesDir = path.resolve(process.cwd(), 'src/content/articles');
  if (fs.existsSync(articlesDir)) {
    const files = fs.readdirSync(articlesDir).filter((file) => file.endsWith('.mdx'));
    for (const file of files) {
      const slug = file.replace(/\.mdx$/, '');
      urls.push(`${BASE_URL}/articles/${slug}/`);
    }
  }

  return urls;
}

/**
 * Envia as URLs para um endpoint do IndexNow.
 *
 * @param {string} endpoint URL da API do IndexNow.
 * @param {string[]} urlList Lista de URLs a submeter.
 * @returns {Promise<{ endpoint: string, status: number, ok: boolean, message: string }>}
 */
async function submitToIndexNow(endpoint, urlList) {
  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const status = response.status;
    // 200: OK, 202: Accepted (na fila de processamento)
    const ok = status === 200 || status === 202;

    let message = '';
    if (status === 200) {
      message = 'OK - URLs submetidas com sucesso';
    } else if (status === 202) {
      message = 'Accepted - URLs recebidas e enfileiradas pelo motor de busca';
    } else if (status === 400) {
      message = 'Bad Request - Formato inválido';
    } else if (status === 403) {
      message = 'Forbidden - Chave inválida ou não encontrada na URL especificada';
    } else if (status === 422) {
      message = 'Unprocessable Entity - URLs não correspondem ao host informado';
    } else {
      message = `HTTP ${status}`;
    }

    return { endpoint, status, ok, message };
  } catch (error) {
    return {
      endpoint,
      status: 0,
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Função principal que executa a notificação para todos os endpoints.
 */
async function main() {
  console.log('🚀 Iniciando notificação via IndexNow...');
  console.log(`🔑 Chave: ${INDEXNOW_KEY}`);
  console.log(`📍 Localização da chave: ${KEY_LOCATION}`);

  const urls = getAllSiteUrls();
  console.log(`📄 Total de URLs encontradas: ${urls.length}`);
  urls.forEach((url) => console.log(`   - ${url}`));

  console.log('\n📡 Enviando requisições aos endpoints do IndexNow:');

  let successCount = 0;

  for (const endpoint of ENDPOINTS) {
    process.stdout.write(`   Enviando para ${endpoint}... `);
    const result = await submitToIndexNow(endpoint, urls);

    if (result.ok) {
      console.log(`✅ [${result.status}] ${result.message}`);
      successCount++;
    } else {
      console.log(`⚠️  [${result.status}] ${result.message}`);
    }
  }

  if (successCount > 0) {
    console.log('\n🎉 Notificação do IndexNow concluída com sucesso!');
  } else {
    console.warn('\n⚠️  Nenhum endpoint retornou sucesso imediato (pode haver atraso na propagação da chave).');
  }
}

// Executa se chamado diretamente via CLI
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename || '')) {
  main().catch((err) => {
    console.error('❌ Erro na execução do IndexNow:', err);
    process.exit(1);
  });
}
