/**
 * Utilitários do Fluxo de Autenticação OAuth 2.0 da API do Pinterest v5.
 *
 * Em conformidade com o Quickstart oficial (pinterest/api-quickstart),
 * provê métodos para geração de URLs de consentimento, estruturação de
 * cabeçalhos Basic Auth e montagem de payloads para troca e renovação de tokens.
 */

export const DEFAULT_PINTEREST_APP_ID = '1623625';

export const DEFAULT_PINTEREST_SCOPES = [
  'boards:read',
  'boards:write',
  'pins:read',
  'pins:write',
  'ads:read',
  'ads:write',
];

export const PINTEREST_OAUTH_TOKEN_URL = 'https://api.pinterest.com/v5/oauth/token';
export const PINTEREST_OAUTH_AUTH_URL = 'https://www.pinterest.com/oauth/';

export interface AuthorizationUrlOptions {
  appId?: string;
  redirectUri: string;
  scopes?: string[];
  state?: string;
}

export interface TokenExchangeOptions {
  redirectUri: string;
}

export interface PinterestTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
}

/**
 * Constrói a URL oficial de consentimento OAuth do Pinterest v5.
 *
 * Args:
 *   options: Opções de configuração (appId, redirectUri, scopes, state).
 *
 * Returns:
 *   URL completa para o usuário aprovar as permissões do aplicativo no navegador.
 */
export function buildAuthorizationUrl(options: AuthorizationUrlOptions): string {
  const appId = options.appId || DEFAULT_PINTEREST_APP_ID;
  const scopes = options.scopes || DEFAULT_PINTEREST_SCOPES;

  const url = new URL(PINTEREST_OAUTH_AUTH_URL);
  url.searchParams.set('client_id', appId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', options.redirectUri);
  url.searchParams.set('scope', scopes.join(','));

  if (options.state) {
    url.searchParams.set('state', options.state);
  }

  return url.toString();
}

/**
 * Constrói o corpo form-urlencoded para o endpoint de troca do código de autorização.
 *
 * Args:
 *   code: O authorization_code retornado no redirect após consentimento.
 *   options: Opções contendo a redirectUri correspondente.
 *
 * Returns:
 *   Objeto URLSearchParams formatado para envio no POST /v5/oauth/token.
 */
export function buildTokenExchangePayload(
  code: string,
  options: TokenExchangeOptions,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set('grant_type', 'authorization_code');
  params.set('code', code);
  params.set('redirect_uri', options.redirectUri);
  return params;
}

/**
 * Constrói o corpo form-urlencoded para renovação contínua de token de acesso via refresh_token.
 *
 * Args:
 *   refreshToken: O token de renovação persistido.
 *
 * Returns:
 *   Objeto URLSearchParams formatado para envio no POST /v5/oauth/token.
 */
export function buildTokenRefreshPayload(refreshToken: string): URLSearchParams {
  const params = new URLSearchParams();
  params.set('grant_type', 'refresh_token');
  params.set('refresh_token', refreshToken);
  return params;
}

/**
 * Gera o cabeçalho Authorization Basic em Base64 para autenticação com a API do Pinterest.
 *
 * Args:
 *   appId: O ID da aplicação no Pinterest Developers (ex.: 1623625).
 *   appSecret: O segredo da aplicação gerado no console de desenvolvedor.
 *
 * Returns:
 *   String no formato 'Basic <base64(appId:appSecret)>'.
 */
export function buildBasicAuthHeader(appId: string, appSecret: string): string {
  const credentials = `${appId}:${appSecret}`;
  const base64 = Buffer.from(credentials).toString('base64');
  return `Basic ${base64}`;
}
