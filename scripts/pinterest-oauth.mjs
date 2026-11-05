#!/usr/bin/env node
/**
 * Script de Autenticação OAuth 2.0 para Pinterest API v5.
 *
 * Implementa o fluxo oficial de autorização do Pinterest (pinterest/api-quickstart),
 * permitindo obter e renovar Access Tokens e Refresh Tokens automaticamente.
 *
 * Uso:
 *   # Obter novo token via consentimento no navegador:
 *   node scripts/pinterest-oauth.mjs
 *
 *   # Renovar access token existente via refresh_token:
 *   node scripts/pinterest-oauth.mjs --refresh
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';

// Carrega variáveis de ambiente do .env caso exista
if (process.loadEnvFile && fs.existsSync(path.resolve(process.cwd(), '.env'))) {
  process.loadEnvFile();
}

const APP_ID = process.env.PINTEREST_APP_ID || '1623625';
const APP_SECRET = process.env.PINTEREST_APP_SECRET || '';
const PORT = 8085;
const REDIRECT_URI = `http://localhost:${PORT}/`;
const TOKEN_FILE = path.resolve(process.cwd(), '.pinterest-token.json');

const SCOPES = [
  'boards:read',
  'boards:write',
  'pins:read',
  'pins:write',
  'ads:read',
  'ads:write',
];

/**
 * Constrói o cabeçalho Authorization Basic em Base64.
 */
function getBasicAuth(appId, appSecret) {
  return 'Basic ' + Buffer.from(`${appId}:${appSecret}`).toString('base64');
}

/**
 * Renova o access token usando um refresh token persistido.
 */
async function refreshToken(secret) {
  if (!fs.existsSync(TOKEN_FILE)) {
    console.error(`❌ Arquivo de token não encontrado em: ${TOKEN_FILE}`);
    console.log('Execute primeiro sem "--refresh" para autenticar no navegador.');
    process.exit(1);
  }

  const tokenData = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
  if (!tokenData.refresh_token) {
    console.error('❌ Nenhum refresh_token encontrado no arquivo.');
    process.exit(1);
  }

  console.log('🔄 Renovando Access Token com o Pinterest OAuth endpoint...');

  const bodyParams = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokenData.refresh_token,
  });

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  if (secret) {
    headers['Authorization'] = getBasicAuth(APP_ID, secret);
  }

  const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
    method: 'POST',
    headers,
    body: bodyParams,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Falha na renovação (${response.status}):`, errorText);
    process.exit(1);
  }

  const newTokens = await response.json();
  const updatedData = {
    ...tokenData,
    ...newTokens,
    updated_at: new Date().toISOString(),
  };

  fs.writeFileSync(TOKEN_FILE, JSON.stringify(updatedData, null, 2), 'utf-8');
  console.log('✅ Access Token renovado com sucesso!');
  console.log(`🔑 Novo Access Token: ${newTokens.access_token}`);
  console.log(`⏱️  Expira em: ${newTokens.expires_in} segundos`);
}

/**
 * Inicia o fluxo interativo do navegador para obter tokens pela primeira vez.
 */
async function startAuthFlow() {
  const authUrl = new URL('https://www.pinterest.com/oauth/');
  authUrl.searchParams.set('client_id', APP_ID);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', SCOPES.join(','));

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
      const code = parsedUrl.searchParams.get('code');
      const error = parsedUrl.searchParams.get('error');

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h1>❌ Erro na autorização:</h1><p>${error}</p>`);
        server.close();
        process.exit(1);
      }

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <div style="font-family: system-ui, sans-serif; text-align: center; padding: 40px;">
            <h1 style="color: #059669;">✅ Autorização Concluída com Sucesso!</h1>
            <p>O código foi recebido e o token está sendo gerado.</p>
            <p>Você pode fechar esta aba e retornar ao terminal.</p>
          </div>
        `);

        console.log('\n📥 Código de autorização recebido com sucesso!');
        console.log('🔄 Trocando código por Access Token e Refresh Token...');

        const tokenBody = new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
        });

        const headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
        };

        if (APP_SECRET) {
          headers['Authorization'] = getBasicAuth(APP_ID, APP_SECRET);
        } else {
          tokenBody.set('client_id', APP_ID);
        }

        const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
          method: 'POST',
          headers,
          body: tokenBody,
        });

        if (!tokenRes.ok) {
          const errBody = await tokenRes.text();
          console.error(`\n❌ Falha na troca do token (${tokenRes.status}):`, errBody);
          server.close();
          process.exit(1);
        }

        const tokens = await tokenRes.json();
        const payloadToSave = {
          app_id: APP_ID,
          created_at: new Date().toISOString(),
          ...tokens,
        };

        fs.writeFileSync(TOKEN_FILE, JSON.stringify(payloadToSave, null, 2), 'utf-8');

        console.log('\n🎉 Tokens obtidos e salvos em .pinterest-token.json:');
        console.log('──────────────────────────────────────────────────────────');
        console.log(`📌 Access Token:  ${tokens.access_token}`);
        if (tokens.refresh_token) {
          console.log(`🔁 Refresh Token: ${tokens.refresh_token}`);
        }
        console.log(`⏱️  Expira em:     ${tokens.expires_in}s (~30 dias)`);
        console.log(`🎯 Escopos:       ${tokens.scope}`);
        console.log('──────────────────────────────────────────────────────────');
        console.log('\n💡 Para utilizar no GitHub Actions, adicione este Access Token');
        console.log('   nos Secrets do repositório como PINTEREST_ACCESS_TOKEN.');

        server.close();
        process.exit(0);
      }
    } catch (err) {
      console.error('❌ Erro no processamento do callback:', err);
      res.writeHead(500);
      res.end('Erro interno');
      server.close();
      process.exit(1);
    }
  });

  server.listen(PORT, () => {
    console.log('==========================================================');
    console.log('🚀 Pinterest API v5 OAuth 2.0 Quickstart');
    console.log(`   App ID: ${APP_ID}`);
    console.log(`   Redirect URI: ${REDIRECT_URI}`);
    console.log('==========================================================\n');
    console.log('👉 Abra o seguinte link no seu navegador para autorizar o app:\n');
    console.log(`\x1b[36m${authUrl.toString()}\x1b[0m\n`);
    console.log('⏳ Aguardando aprovação no navegador (pressione Ctrl+C para cancelar)...');
  });
}

async function main() {
  const isRefreshMode = process.argv.includes('--refresh');

  if (isRefreshMode) {
    await refreshToken(APP_SECRET);
  } else {
    await startAuthFlow();
  }
}

main().catch((err) => {
  console.error('❌ Erro inesperado:', err);
  process.exit(1);
});
