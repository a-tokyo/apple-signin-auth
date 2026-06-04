/* @flow */

import appleSignin, {
  getAuthorizationUrl,
  getClientSecret,
  getAuthorizationToken,
  refreshAuthorizationToken,
  revokeAuthorizationToken,
  verifyIdToken,
  verifyWebhookToken,
  _getApplePublicKeys,
} from '../src/index';

describe('appleSignin test', () => {
  it('exposes all neccessary values as default export', () => {
    expect(appleSignin.getAuthorizationUrl).toBeTruthy();
    expect(appleSignin.getClientSecret).toBeTruthy();
    expect(appleSignin.getAuthorizationToken).toBeTruthy();
    expect(appleSignin.refreshAuthorizationToken).toBeTruthy();
    expect(appleSignin.revokeAuthorizationToken).toBeTruthy();
    expect(appleSignin.verifyIdToken).toBeTruthy();
    expect(appleSignin.verifyWebhookToken).toBeTruthy();
    expect(appleSignin._getApplePublicKeys).toBeTruthy();
  });

  it('exposes all neccessary values as module.exports', () => {
    expect(getAuthorizationUrl).toBeTruthy();
    expect(getClientSecret).toBeTruthy();
    expect(getAuthorizationToken).toBeTruthy();
    expect(refreshAuthorizationToken).toBeTruthy();
    expect(revokeAuthorizationToken).toBeTruthy();
    expect(verifyIdToken).toBeTruthy();
    expect(verifyWebhookToken).toBeTruthy();
    expect(_getApplePublicKeys).toBeTruthy();
  });
});

describe('test for each functions', () => {
  describe('test revokeAuthorizationToken functions', () => {
    const token = 'test token';
    it('Should not throw error when response is empty', async () => {
      const result = await appleSignin.revokeAuthorizationToken(token, {
        clientID: 'clientID',
        clientSecret: 'clientSecret',
        tokenTypeHint: 'refresh_token',
      });
      expect(result).toEqual('');
    });
  });

  describe('test getAuthorizationToken functions', () => {
    const code = 'test code';
    it('Should not throw error when response is empty', async () => {
      const result = await appleSignin.getAuthorizationToken(code, {
        clientID: 'clientID',
        clientSecret: 'clientSecret',
        redirectUri: 'https://example.com',
      });
      expect(result).toEqual({
        error: 'invalid_grant',
        error_description: 'The code has expired or has been revoked.',
      });
    });
  });

  describe('test refreshAuthorizationToken functions', () => {
    const refreshToken = 'test refreshToken';
    it('Should not throw error when response is empty', async () => {
      const result = await appleSignin.refreshAuthorizationToken(refreshToken, {
        clientID: 'clientID',
        clientSecret: 'clientSecret',
      });
      expect(result).toEqual({
        error: 'invalid_grant',
        error_description: 'The token has expired or has been revoked.',
      });
    });
  });

  describe('test _getApplePublicKeys functions', () => {
    it('Should not throw error when response is empty', async () => {
      const result = await appleSignin._getApplePublicKeys();
      expect(result).not.toBeNull();
    });
  });
});
