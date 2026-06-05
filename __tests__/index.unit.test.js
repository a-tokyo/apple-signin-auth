// Comprehensive, network-free unit tests using real crypto + a mocked fetch
// (via _setFetch). Complements the live-endpoint tests in index.test.js.
// Critical coverage: getClientSecret (ES256 signing) and verifyIdToken /
// verifyWebhookToken (RS256 verification through native-crypto JWK parsing),
// neither of which the live tests exercise.

import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import jwt from 'jsonwebtoken';
import appleSignin, { _setFetch } from '../src/index';

const ISS = 'https://appleid.apple.com';

// A stable RSA keypair used to sign id/webhook tokens, exposed as a JWKS.
const rsa = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const rsaJwk = rsa.publicKey.export({ format: 'jwk' });
const KID = 'test-key-1';
const jwksResponse = {
  keys: [
    {
      kty: 'RSA',
      kid: KID,
      use: 'sig',
      alg: 'RS256',
      n: rsaJwk.n,
      e: rsaJwk.e,
    },
  ],
};

// A second RSA key (attacker) NOT in the JWKS.
const rsaAttacker = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

const mockFetch = (handler) => _setFetch(handler);
const jwksFetch = () =>
  mockFetch(async (url) => {
    if (url.includes('/auth/keys')) {
      return { text: async () => JSON.stringify(jwksResponse) };
    }
    throw new Error(`unexpected fetch: ${url}`);
  });

const signId = (payload, opts = {}, key = rsa.privateKey, kid = KID) =>
  jwt.sign(payload, key, {
    algorithm: 'RS256',
    keyid: kid,
    issuer: ISS,
    audience: 'com.app',
    expiresIn: '5m',
    ...opts,
  });

describe('getAuthorizationUrl', () => {
  it('builds the base url with defaults and no scope junk', () => {
    const url = appleSignin.getAuthorizationUrl({
      clientID: 'com.app',
      redirectUri: 'https://x.com/cb',
    });
    expect(url).toContain('https://appleid.apple.com/auth/authorize');
    expect(url).toContain('response_type=code');
    expect(url).toContain('state=state');
    expect(url).toContain('client_id=com.app');
    expect(url).toContain('redirect_uri=https%3A%2F%2Fx.com%2Fcb');
    expect(url).toContain('scope=openid');
    expect(url).not.toContain('undefined');
    expect(url).not.toContain('response_mode=');
  });

  it('forces form_post when scope includes email', () => {
    const url = appleSignin.getAuthorizationUrl({
      clientID: 'c',
      redirectUri: 'https://r',
      scope: 'email name',
    });
    expect(url).toContain('scope=openid+email+name');
    expect(url).toContain('response_mode=form_post');
  });

  it('uses provided responseMode when scope has no email', () => {
    const url = appleSignin.getAuthorizationUrl({
      clientID: 'c',
      redirectUri: 'https://r',
      scope: 'name',
      responseMode: 'query',
    });
    expect(url).toContain('scope=openid+name');
    expect(url).toContain('response_mode=query');
  });

  it('respects custom state', () => {
    const url = appleSignin.getAuthorizationUrl({
      clientID: 'c',
      redirectUri: 'https://r',
      state: 'nonce-123',
    });
    expect(url).toContain('state=nonce-123');
  });

  it('throws on missing required fields', () => {
    expect(() => appleSignin.getAuthorizationUrl()).toThrow(
      /clientID is empty/,
    );
    expect(() => appleSignin.getAuthorizationUrl({ clientID: 'c' })).toThrow(
      /redirectUri is empty/,
    );
  });
});

describe('getClientSecret (ES256 signing)', () => {
  const ec = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const ecPrivPem = ec.privateKey.export({ type: 'pkcs8', format: 'pem' });
  const ecPubPem = ec.publicKey.export({ type: 'spki', format: 'pem' });

  it('produces a valid ES256 JWT with correct claims and header', () => {
    const secret = appleSignin.getClientSecret({
      clientID: 'com.app',
      teamID: 'TEAM123',
      keyIdentifier: 'KEY123',
      privateKey: ecPrivPem,
    });
    const decoded = jwt.verify(secret, ecPubPem, { algorithms: ['ES256'] });
    expect(decoded.iss).toBe('TEAM123');
    expect(decoded.sub).toBe('com.app');
    expect(decoded.aud).toBe(ISS);
    expect(decoded.exp - decoded.iat).toBe(300);

    const full = jwt.decode(secret, { complete: true });
    expect(full.header.alg).toBe('ES256');
    expect(full.header.kid).toBe('KEY123');
  });

  it('honors expAfter', () => {
    const secret = appleSignin.getClientSecret({
      clientID: 'c',
      teamID: 't',
      keyIdentifier: 'k',
      privateKey: ecPrivPem,
      expAfter: 600,
    });
    const d = jwt.decode(secret);
    expect(d.exp - d.iat).toBe(600);
  });

  it('supports the legacy teamId alias', () => {
    const secret = appleSignin.getClientSecret({
      clientID: 'c',
      teamId: 'LEGACY_TEAM',
      keyIdentifier: 'k',
      privateKey: ecPrivPem,
    });
    expect(jwt.decode(secret).iss).toBe('LEGACY_TEAM');
  });

  it('reads the key from privateKeyPath', () => {
    const p = path.join(os.tmpdir(), `apple-test-key-${Date.now()}.pem`);
    fs.writeFileSync(p, ecPrivPem);
    try {
      const secret = appleSignin.getClientSecret({
        clientID: 'c',
        teamID: 't',
        keyIdentifier: 'k',
        privateKeyPath: p,
      });
      const decoded = jwt.verify(secret, ecPubPem, { algorithms: ['ES256'] });
      expect(decoded.sub).toBe('c');
    } finally {
      fs.unlinkSync(p);
    }
  });

  it('validates input', () => {
    expect(() => appleSignin.getClientSecret()).toThrow(/clientID is empty/);
    expect(() => appleSignin.getClientSecret({ clientID: 'c' })).toThrow(
      /teamID is empty/,
    );
    expect(() =>
      appleSignin.getClientSecret({ clientID: 'c', teamID: 't' }),
    ).toThrow(/keyIdentifier is empty/);
    expect(() =>
      appleSignin.getClientSecret({
        clientID: 'c',
        teamID: 't',
        keyIdentifier: 'k',
      }),
    ).toThrow(/privateKey and privateKeyPath are empty/);
    expect(() =>
      appleSignin.getClientSecret({
        clientID: 'c',
        teamID: 't',
        keyIdentifier: 'k',
        privateKey: 'x',
        privateKeyPath: 'y',
      }),
    ).toThrow(/cannot be passed together/);
    expect(() =>
      appleSignin.getClientSecret({
        clientID: 'c',
        teamID: 't',
        keyIdentifier: 'k',
        privateKeyPath: '/does/not/exist.pem',
      }),
    ).toThrow(/Can't find private key/);
  });
});

describe('_getApplePublicKeys (native crypto JWK parsing)', () => {
  beforeEach(jwksFetch);

  it('fetches and converts JWKS to PEM public keys', async () => {
    const keys = await appleSignin._getApplePublicKeys();
    expect(keys).toHaveLength(1);
    expect(keys[0]).toContain('-----BEGIN PUBLIC KEY-----');
    // The derived PEM must actually verify a token signed by the matching key.
    const token = signId({ sub: 'u' });
    expect(jwt.verify(token, keys[0], { algorithms: ['RS256'] }).sub).toBe('u');
  });

  it('supports disableCaching', async () => {
    const keys = await appleSignin._getApplePublicKeys({
      disableCaching: true,
    });
    expect(keys).toHaveLength(1);
  });
});

describe('verifyIdToken (RS256 verification — critical path)', () => {
  beforeEach(jwksFetch);

  it('verifies a genuine token and returns the payload', async () => {
    const token = signId({
      sub: 'user123',
      email: 'a@b.com',
      email_verified: true,
    });
    const decoded = await appleSignin.verifyIdToken(token, {
      audience: 'com.app',
    });
    expect(decoded.sub).toBe('user123');
    expect(decoded.email).toBe('a@b.com');
    expect(decoded.iss).toBe(ISS);
  });

  it('rejects a tampered token', async () => {
    const token = `${signId({ sub: 'u' }).slice(0, -4)}AAAA`;
    await expect(
      appleSignin.verifyIdToken(token, { audience: 'com.app' }),
    ).rejects.toBeDefined();
  });

  it('rejects a wrong audience', async () => {
    const token = signId({ sub: 'u' });
    await expect(
      appleSignin.verifyIdToken(token, { audience: 'other.app' }),
    ).rejects.toBeDefined();
  });

  it('rejects a wrong issuer', async () => {
    const token = signId({ sub: 'u' }, { issuer: 'https://evil.example.com' });
    await expect(
      appleSignin.verifyIdToken(token, { audience: 'com.app' }),
    ).rejects.toBeDefined();
  });

  it('rejects a token whose kid is not in the JWKS', async () => {
    const token = signId({ sub: 'u' }, {}, rsa.privateKey, 'unknown-kid');
    await expect(
      appleSignin.verifyIdToken(token, { audience: 'com.app' }),
    ).rejects.toBeDefined();
  });

  it('SECURITY: rejects a forged token signed by a foreign key but spoofing a known kid', async () => {
    // Attacker signs with their own key but sets kid to a legitimate one.
    const forged = signId({ sub: 'attacker' }, {}, rsaAttacker.privateKey, KID);
    await expect(
      appleSignin.verifyIdToken(forged, { audience: 'com.app' }),
    ).rejects.toBeDefined();
  });
});

describe('verifyWebhookToken', () => {
  beforeEach(jwksFetch);

  it('verifies and JSON-parses the events claim', async () => {
    const token = signId({
      events: JSON.stringify({
        type: 'email-disabled',
        sub: 'u1',
        email: 'x@y.com',
      }),
    });
    const decoded = await appleSignin.verifyWebhookToken(token, {
      audience: 'com.app',
    });
    expect(decoded.events.type).toBe('email-disabled');
    expect(decoded.events.sub).toBe('u1');
    expect(decoded.iss).toBe(ISS);
  });
});

describe('token endpoints (request shape + response parsing)', () => {
  let lastUrl;
  let lastBody;
  beforeEach(() => {
    mockFetch(async (url, opts) => {
      lastUrl = url;
      lastBody = opts.body.toString();
      if (url.includes('/auth/token')) {
        return {
          text: async () =>
            JSON.stringify({
              access_token: 'AT',
              token_type: 'Bearer',
              expires_in: 3600,
              refresh_token: 'RT',
              id_token: 'IDT',
            }),
        };
      }
      if (url.includes('/auth/revoke')) {
        return { text: async () => '' };
      }
      throw new Error(`unexpected: ${url}`);
    });
  });

  it('getAuthorizationToken sends the right params and parses JSON', async () => {
    const res = await appleSignin.getAuthorizationToken('CODE', {
      clientID: 'c',
      clientSecret: 's',
      redirectUri: 'https://r.com/cb',
      codeVerifier: 'CV',
    });
    expect(res.access_token).toBe('AT');
    expect(lastUrl).toContain('/auth/token');
    expect(lastBody).toContain('grant_type=authorization_code');
    expect(lastBody).toContain('code=CODE');
    expect(lastBody).toContain('client_id=c');
    expect(lastBody).toContain('redirect_uri=https');
    expect(lastBody).toContain('code_verifier=CV');
  });

  it('refreshAuthorizationToken sends grant_type=refresh_token', async () => {
    const res = await appleSignin.refreshAuthorizationToken('RT', {
      clientID: 'c',
      clientSecret: 's',
    });
    expect(res.access_token).toBe('AT');
    expect(lastBody).toContain('grant_type=refresh_token');
    expect(lastBody).toContain('refresh_token=RT');
  });

  it('revokeAuthorizationToken sends token + hint and returns empty', async () => {
    const res = await appleSignin.revokeAuthorizationToken('TOKEN', {
      clientID: 'c',
      clientSecret: 's',
      tokenTypeHint: 'refresh_token',
    });
    expect(res).toBe('');
    expect(lastBody).toContain('token=TOKEN');
    expect(lastBody).toContain('token_type_hint=refresh_token');
  });

  it('validates required credentials', async () => {
    await expect(
      appleSignin.getAuthorizationToken('c', { clientSecret: 's' }),
    ).rejects.toThrow(/clientID is empty/);
    await expect(
      appleSignin.getAuthorizationToken('c', { clientID: 'c' }),
    ).rejects.toThrow(/clientSecret is empty/);
    await expect(
      appleSignin.refreshAuthorizationToken('r', { clientID: 'c' }),
    ).rejects.toThrow(/clientSecret is empty/);
    await expect(
      appleSignin.revokeAuthorizationToken('t', { clientID: 'c' }),
    ).rejects.toThrow(/clientSecret is empty/);
  });
});
