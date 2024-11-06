/* @flow */
import { URL } from 'url';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import NodeRSA from 'node-rsa';
import rawFetch from 'node-fetch';

/**
 * Fetch function
 */
let fetch = rawFetch;

export type AppleIdTokenType = {
  /** The issuer-registered claim key, which has the value https://appleid.apple.com. */
  iss: string,
  /** The unique identifier for the user. */
  sub: string,
  /** Your client_id in your Apple Developer account. */
  aud: string,
  /** The expiry time for the token. This value is typically set to five minutes. */
  exp: string,
  /** The time the token was issued. */
  iat: string,
  /** A String value used to associate a client session and an ID token. This value is used to mitigate replay attacks and is present only if passed during the authorization request. */
  nonce: string,
  /** A Boolean value that indicates whether the transaction is on a nonce-supported platform. If you sent a nonce in the authorization request but do not see the nonce claim in the ID token, check this claim to determine how to proceed. If this claim returns true you should treat nonce as mandatory and fail the transaction; otherwise, you can proceed treating the nonce as optional. */
  nonce_supported: boolean,
  /** The user's email address. */
  email: string,
  /** A String or Boolean value that indicates whether the service has verified the email. The value of this claim is always true because the servers only return verified email addresses. */
  email_verified: 'true' | 'false' | boolean,
  /** A String or Boolean value that indicates whether the email shared by the user is the proxy address. */
  is_private_email: 'true' | 'false' | boolean,
};

export type AppleWebhookTokenEventType = {
  /** The type of event. */
  type:
    | 'email-disabled'
    | 'email-enabled'
    | 'consent-revoked'
    | 'account-delete',
  /** The unique identifier for the user. */
  sub: string,
  /** The time the event occurred. */
  event_time: number,
  /** The email address for the user. Provided on `email-disabled` and `email-enabled` events only. */
  email?: string,
  /** A String or Boolean value that indicates whether the email shared by the user is the proxy address. The value of this claim is always true because the email events relate only to the user's private relay service forwarding preferences. Provided on `email-disabled` and `email-enabled` events only. */
  is_private_email?: 'true' | 'false' | boolean,
};

export type AppleWebhookTokenType = {
  /** The issuer-registered claim key, which has the value https://appleid.apple.com. */
  iss: string,
  /** Your client_id in your Apple Developer account. */
  aud: string,
  /** The expiry time for the token. This value is typically set to five minutes. */
  exp: string,
  /** The time the token was issued. */
  iat: string,
  /** The unique identifier for this token. */
  jti: string,
  /** The event description. */
  events: AppleWebhookTokenEventType,
};

type RawAppleWebhookTokenType = {
  /** The issuer-registered claim key, which has the value https://appleid.apple.com. */
  iss: string,
  /** Your client_id in your Apple Developer account. */
  aud: string,
  /** The expiry time for the token. This value is typically set to five minutes. */
  exp: string,
  /** The time the token was issued. */
  iat: string,
  /** The unique identifier for this token. */
  jti: string,
  /** The JSON-stringified event description. */
  events: string,
};

export type AppleAuthorizationTokenResponseType = {
  /** A token used to access allowed data. */
  access_token: string,
  /** It will always be Bearer. */
  token_type: 'Bearer',
  /** The amount of time, in seconds, before the access token expires. */
  expires_in: 300,
  /** used to regenerate (new) access tokens. */
  refresh_token: string,
  /** A JSON Web Token that contains the user’s identity information. */
  id_token: string,
};

const ENDPOINT_URL = 'https://appleid.apple.com';

/** Apple keys cache - { kid: public_key } */
let APPLE_KEYS_CACHE: { [kid: string]: string } = {};

/** Gets the Apple Authorizaion URL */
const getAuthorizationUrl = (
  options: {
    clientID: string,
    redirectUri: string,
    responseMode?: 'query' | 'fragment' | 'form_post',
    state?: string,
    scope?: string,
  } = {},
): string => {
  // Handle input errors
  if (!options.clientID) {
    throw Error('clientID is empty');
  }
  if (!options.redirectUri) {
    throw Error('redirectUri is empty');
  }

  const url = new URL(ENDPOINT_URL);
  url.pathname = '/auth/authorize';

  url.searchParams.append('response_type', 'code');
  url.searchParams.append('state', options.state || 'state');
  url.searchParams.append('client_id', options.clientID);
  url.searchParams.append('redirect_uri', options.redirectUri);
  url.searchParams.append('scope', `openid${` ${options.scope}`}`);

  if (options.scope?.includes('email')) {
    // Force set response_mode to 'form_post' if scope includes email
    url.searchParams.append('response_mode', 'form_post');
  } else if (options.responseMode) {
    // Set response_mode to input responseMode
    url.searchParams.append('response_mode', options.responseMode);
  }

  return url.toString();
};

/** Gets your Apple clientSecret */
const getClientSecret = (
  options: {
    clientID: string,
    teamID: string,
    keyIdentifier: string,
    privateKey?: string, // one of [privateKeyPath, privateKey] need to be passed
    privateKeyPath?: string, // one of [privateKeyPath, privateKey] need to be passed
    expAfter?: number,
  } = {},
): string => {
  // Handle input errors
  if (!options.clientID) {
    throw new Error('clientID is empty');
  }
  if (!options.teamID && !options.teamId) {
    // handle 'teamId' legacy till we remove in next major
    throw new Error('teamID is empty');
  }
  if (!options.keyIdentifier) {
    throw new Error('keyIdentifier is empty');
  }
  if (!options.privateKeyPath && !options.privateKey) {
    throw new Error('privateKey and privateKeyPath are empty');
  }
  if (options.privateKeyPath && options.privateKey) {
    throw new Error(
      'privateKey and privateKeyPath cannot be passed together, choose one of them',
    );
  }
  if (options.privateKeyPath && !fs.existsSync(options.privateKeyPath)) {
    throw new Error("Can't find private key");
  }

  const timeNow = Math.floor(Date.now() / 1000);

  const claims = {
    iss: options.teamID || options.teamId, // handle 'teamId' legacy till we remove in next major
    iat: timeNow,
    exp: timeNow + (options.expAfter || 300), // default to 5 minutes
    aud: ENDPOINT_URL,
    sub: options.clientID,
  };

  const header = { alg: 'ES256', kid: options.keyIdentifier };
  const key = options.privateKeyPath
    ? fs.readFileSync(options.privateKeyPath)
    : options.privateKey;

  return jwt.sign(claims, key, { algorithm: 'ES256', header });
};

/**
 * populate function
 *
 * populate response as json if can be
 */
const _populateResAsJson = async (res) => {
  const data = await res.text();
  if (!data) {
    return data;
  }
  return JSON.parse(data);
};

/** Gets an Apple authorization token */
const getAuthorizationToken = async (
  code: string,
  options: {
    clientID: string,
    redirectUri: string,
    clientSecret: string,
    codeVerifier?: string
  },
): Promise<AppleAuthorizationTokenResponseType> => {
  // Handle input errors
  if (!options.clientID) {
    throw new Error('clientID is empty');
  }
  if (!options.clientSecret) {
    throw new Error('clientSecret is empty');
  }

  const url = new URL(ENDPOINT_URL);
  url.pathname = '/auth/token';

  const params = new URLSearchParams();
  params.append('client_id', options.clientID);
  params.append('client_secret', options.clientSecret);
  params.append('code', code);
  params.append('grant_type', 'authorization_code');
  if (options.redirectUri) {
    params.append('redirect_uri', options.redirectUri);
  }
  if (options.codeVerifier) {
    params.append('code_verifier', options.codeVerifier);
  }

  return fetch(url.toString(), {
    method: 'POST',
    body: params,
  }).then((res) => _populateResAsJson(res));
};

/** Refreshes an Apple authorization token */
const refreshAuthorizationToken = async (
  refreshToken: string,
  options: {
    clientID: string,
    clientSecret: string,
  },
): Promise<AppleAuthorizationTokenResponseType> => {
  if (!options.clientID) {
    throw new Error('clientID is empty');
  }
  if (!options.clientSecret) {
    throw new Error('clientSecret is empty');
  }

  const url = new URL(ENDPOINT_URL);
  url.pathname = '/auth/token';

  const params = new URLSearchParams();
  params.append('client_id', options.clientID);
  params.append('client_secret', options.clientSecret);
  params.append('refresh_token', refreshToken);
  params.append('grant_type', 'refresh_token');

  return fetch(url.toString(), {
    method: 'POST',
    body: params,
  }).then((res) => _populateResAsJson(res));
};

/** Revoke Apple authorization token */
const revokeAuthorizationToken = async (
  token: string,
  options: {
    clientID: string,
    clientSecret: string,
    tokenTypeHint: 'refresh_token' | 'access_token',
  },
): Promise<any> => {
  if (!options.clientID) {
    throw new Error('clientID is empty');
  }
  if (!options.clientSecret) {
    throw new Error('clientSecret is empty');
  }

  const url = new URL(ENDPOINT_URL);
  url.pathname = '/auth/revoke';

  const params = new URLSearchParams();
  params.append('client_id', options.clientID);
  params.append('client_secret', options.clientSecret);
  params.append('token', token);
  params.append('token_type_hint', options.tokenTypeHint);

  const result = await fetch(url.toString(), {
    method: 'POST',
    body: params,
  });

  return _populateResAsJson(result);
};

/** Gets an Array of Apple Public Keys that can be used to decode Apple's id tokens */
const _getApplePublicKeys = async ({
  disableCaching,
}: { disableCaching?: boolean } = {}): Array<string> => {
  const url = new URL(ENDPOINT_URL);
  url.pathname = '/auth/keys';

  // Fetch Apple's Public keys
  const data = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((res) => _populateResAsJson(res));

  // Reset cache - will be refilled below
  APPLE_KEYS_CACHE = {};

  // Parse and cache keys
  const keyValues = data.keys.map((key) => {
    // parse key
    const publKeyObj = new NodeRSA();
    publKeyObj.importKey(
      { n: Buffer.from(key.n, 'base64'), e: Buffer.from(key.e, 'base64') },
      'components-public',
    );
    const publicKey = publKeyObj.exportKey(['public']);

    // cache key
    if (!disableCaching) {
      APPLE_KEYS_CACHE[key.kid] = publicKey;
    }

    // return public key string
    return publicKey;
  });

  // Return parsed keys
  return keyValues;
};

/** Gets the Apple Public Key corresponding to the JSON's header  */
const _getIdTokenApplePublicKey = async (
  header: string,
  cb: (?Error, ?string) => any,
): Function => {
  /** error if found */
  let error;
  // attempt fetching from cache
  if (APPLE_KEYS_CACHE[header.kid]) {
    return cb(null, APPLE_KEYS_CACHE[header.kid]);
  }
  try {
    // fetch and cache current Apple public keys
    await _getApplePublicKeys();
  } catch (err) {
    // key was not fetched - highly unlikely, means apple is having issues or somebody faked the JSON
    // we will still try to get the key from the cache
    error = err;
  }
  // attempt fetching from cache
  if (APPLE_KEYS_CACHE[header.kid]) {
    return cb(null, APPLE_KEYS_CACHE[header.kid]);
  }
  // key was not fetched - highly unlikely, means apple is having issues or somebody faked the JSON
  return cb(error || new Error('input error: Invalid id token public key id'));
};

/** Verifies an Apple id token */
const verifyIdToken = async (
  /** id_token provided by Apple post Auth  */
  idToken: string,
  /** JWT verify options - Full list here https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback  */
  options: Object = {},
): Promise<AppleIdTokenType> =>
  new Promise((resolve, reject) =>
    jwt.verify(
      idToken,
      _getIdTokenApplePublicKey,
      {
        algorithms: 'RS256',
        issuer: ENDPOINT_URL,
        ...options,
      },
      (error: Error, decoded: AppleIdTokenType) =>
        error ? reject(error) : resolve(decoded),
    ),
  );

const verifyWebhookToken = async (
  /** payload provided by Apple server-to-server notification  */
  webhookToken: string,
  /** JWT verify options - Full list here https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback  */
  options: Object = {},
): Promise<AppleWebhookTokenType> =>
  new Promise((resolve, reject) =>
    jwt.verify(
      webhookToken,
      _getIdTokenApplePublicKey,
      {
        algorithms: 'RS256',
        issuer: ENDPOINT_URL,
        ...options,
      },
      (error: Error, decoded: RawAppleWebhookTokenType) =>
        error
          ? reject(error)
          : resolve({ ...decoded, events: JSON.parse(decoded.events) }),
    ),
  );

/**
 * Sets the fetch function
 *
 * Can be used to pass a proxy fetch function or to override headers and params
 */
const _setFetch = (fetchFn: Function) => {
  fetch = fetchFn;
};

export {
  getAuthorizationUrl,
  getClientSecret,
  getAuthorizationToken,
  refreshAuthorizationToken,
  revokeAuthorizationToken,
  verifyIdToken,
  verifyWebhookToken,
  // Internals - exposed for hacky people
  _getApplePublicKeys,
  _setFetch,
};

/* For backwards compatibility with es5 */
export default {
  getAuthorizationUrl,
  getClientSecret,
  getAuthorizationToken,
  refreshAuthorizationToken,
  revokeAuthorizationToken,
  verifyIdToken,
  verifyWebhookToken,
  // Internals - exposed for hacky people
  _getApplePublicKeys,
  _setFetch,
};
