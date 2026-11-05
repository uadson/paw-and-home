import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PINTEREST_APP_ID,
  DEFAULT_PINTEREST_SCOPES,
  buildAuthorizationUrl,
  buildTokenExchangePayload,
  buildTokenRefreshPayload,
  buildBasicAuthHeader,
} from '../src/utils/pinterest-oauth';

describe('pinterest oauth utils (Quickstart OAuth 2.0 Flow)', () => {
  it('deve usar o App ID 1623625 como padrão do projeto', () => {
    expect(DEFAULT_PINTEREST_APP_ID).toBe('1623625');
  });

  describe('buildAuthorizationUrl', () => {
    it('deve gerar a URL oficial de consentimento OAuth do Pinterest v5', () => {
      const url = buildAuthorizationUrl({
        redirectUri: 'http://localhost:8085/',
      });

      expect(url).toContain('https://www.pinterest.com/oauth/');
      expect(url).toContain('client_id=1623625');
      expect(url).toContain('response_type=code');
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A8085%2F');
      expect(url).toContain('scope=boards%3Aread%2Cboards%3Awrite%2Cpins%3Aread%2Cpins%3Awrite%2Cads%3Aread%2Cads%3Awrite');
    });

    it('deve permitir customização de scopes e state de segurança', () => {
      const url = buildAuthorizationUrl({
        appId: '1623625',
        redirectUri: 'https://example.com/callback',
        scopes: ['pins:read', 'pins:write'],
        state: 'xyz_secure_state',
      });

      expect(url).toContain('client_id=1623625');
      expect(url).toContain('scope=pins%3Aread%2Cpins%3Awrite');
      expect(url).toContain('state=xyz_secure_state');
    });
  });

  describe('buildTokenExchangePayload', () => {
    it('deve estruturar os parâmetros corretos para troca de authorization_code', () => {
      const payload = buildTokenExchangePayload('auth_code_sample', {
        redirectUri: 'http://localhost:8085/',
      });

      expect(payload.get('grant_type')).toBe('authorization_code');
      expect(payload.get('code')).toBe('auth_code_sample');
      expect(payload.get('redirect_uri')).toBe('http://localhost:8085/');
    });
  });

  describe('buildTokenRefreshPayload', () => {
    it('deve estruturar os parâmetros corretos para refresh_token contínuo', () => {
      const payload = buildTokenRefreshPayload('sample_refresh_token');

      expect(payload.get('grant_type')).toBe('refresh_token');
      expect(payload.get('refresh_token')).toBe('sample_refresh_token');
    });
  });

  describe('buildBasicAuthHeader', () => {
    it('deve gerar o header HTTP Basic Authorization em Base64', () => {
      const header = buildBasicAuthHeader('1623625', 'secret123');
      const expectedBase64 = Buffer.from('1623625:secret123').toString('base64');
      expect(header).toBe(`Basic ${expectedBase64}`);
    });
  });
});
