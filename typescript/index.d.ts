export interface AppleIdTokenType {
  /** The issuer-registered claim key, which has the value https://appleid.apple.com. */
  iss: string;
  /** The unique identifier for the user. */
  sub: string;
  /** Your client_id in your Apple Developer account. */
  aud: string;
  /** The expiry time for the token. This value is typically set to five minutes. */
  exp: string;
  /** The time the token was issued. */
  iat: string;
  /** A String value used to associate a client session and an ID token. This value is used to mitigate replay attacks and is present only if passed during the authorization request. */
  nonce: string;
  /** A Boolean value that indicates whether the transaction is on a nonce-supported platform. If you sent a nonce in the authorization request but do not see the nonce claim in the ID token, check this claim to determine how to proceed. If this claim returns true you should treat nonce as mandatory and fail the transaction; otherwise, you can proceed treating the nonce as optional. */
  nonce_supported: boolean;
  /** The user's email address. */
  email: string;
  /** A String or Boolean value that indicates whether the service has verified the email. The value of this claim is always true because the servers only return verified email addresses. */
  email_verified: 'true' | 'false' | boolean;
  /** A String or Boolean value that indicates whether the email shared by the user is the proxy address. */
  is_private_email: 'true' | 'false' | boolean;
}

export interface AppleWebhookTokenEventType {
  /** The type of event. */
  type:
    | 'email-disabled'
    | 'email-enabled'
    | 'consent-revoked'
    | 'account-delete';
  /** The unique identifier for the user. */
  sub: string;
  /** The time the event occurred. */
  event_time: number;
  /** The email address for the user. Provided on `email-disabled` and `email-enabled` events only. */
  email?: string;
  /** A String or Boolean value that indicates whether the email shared by the user is the proxy address. The value of this claim is always true because the email events relate only to the user's private relay service forwarding preferences. Provided on `email-disabled` and `email-enabled` events only. */
  is_private_email?: 'true' | 'false' | boolean;
}

export interface AppleWebhookTokenType {
  /** The issuer-registered claim key, which has the value https://appleid.apple.com. */
  iss: string;
  /** Your client_id in your Apple Developer account. */
  aud: string;
  /** The expiry time for the token. This value is typically set to five minutes. */
  exp: string;
  /** The time the token was issued. */
  iat: string;
  /** The unique identifier for this token. */
  jti: string;
  /** The event description. */
  events: AppleWebhookTokenEventType;
}

export interface AppleAuthorizationTokenResponseType {
  /** A token used to access allowed data. */
  access_token: string;
  /** It will always be Bearer. */
  token_type: 'Bearer';
  /** The amount of time, in seconds, before the access token expires. */
  expires_in: number;
  /** used to regenerate (new) access tokens. */
  refresh_token: string;
  /** A JSON Web Token that contains the user’s identity information. */
  id_token: string;
}

/**
 * Gets the Apple Authorization URL
 */
declare function getAuthorizationUrl(options: {
  clientID: string;
  redirectUri: string;
  responseMode?: 'query' | 'fragment' | 'form_post';
  state?: string;
  scope?: string;
}): string;

/**
 * Gets your Apple clientSecret
 */
declare function getClientSecret(options: {
  clientID: string;
  teamID: string;
  keyIdentifier: string;
  privateKey?: string;
  privateKeyPath?: string;
  expAfter?: number;
}): string;

/**
 * Gets an Apple authorization token
 */
declare function getAuthorizationToken(
  code: string,
  options: {
    clientID: string;
    redirectUri: string;
    clientSecret: string;
  },
): Promise<AppleAuthorizationTokenResponseType>;

/**
 * Refreshes an Apple authorization token
 */
declare function refreshAuthorizationToken(
  refreshToken: string,
  options: {
    clientID: string;
    clientSecret: string;
  },
): Promise<AppleAuthorizationTokenResponseType>;

/**
 * Revoke Apple authorization tokens
 */
declare function revokeAuthorizationToken(
  token: string,
  options: {
    clientID: string;
    clientSecret: string;
    tokenTypeHint: 'refresh_token' | 'access_token';
  },
): Promise<any>;

/**
 * Verifies an Apple id token
 */
declare function verifyIdToken(
  /** id_token provided by Apple post Auth  */
  idToken: string,
  /** JWT verify options - Full list here https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback  */
  options?: {},
): Promise<AppleIdTokenType>;

/**
 * Verifies an Apple server-to-server notification token
 */
declare function verifyWebhookToken(
  /** payload provided by Apple server-to-server notification  */
  webhookToken: string,
  /** JWT verify options - Full list here https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback  */
  options?: {},
): Promise<AppleWebhookTokenType>;

/**
 * Gets an Array of Apple Public Keys that can be used to decode Apple's id tokens
 */
declare function _getApplePublicKeys(options?: {
  disableCaching?: boolean;
}): Promise<string[]>;

/**
 * Sets the fetch function
 *
 * Can be used to pass a proxy fetch function or to override headers and params
 */
declare function _setFetch(fetchFn: (...args: any[]) => any): void;

export {
  getAuthorizationToken,
  getAuthorizationUrl,
  getClientSecret,
  refreshAuthorizationToken,
  revokeAuthorizationToken,
  verifyIdToken,
  verifyWebhookToken,
  _getApplePublicKeys,
  _setFetch,
};

declare const _exports: {
  getAuthorizationToken: typeof getAuthorizationToken;
  getAuthorizationUrl: typeof getAuthorizationUrl;
  getClientSecret: typeof getClientSecret;
  refreshAuthorizationToken: typeof refreshAuthorizationToken;
  revokeAuthorizationToken: typeof revokeAuthorizationToken;
  verifyIdToken: typeof verifyIdToken;
  verifyWebhookToken: typeof verifyWebhookToken;
  _getApplePublicKeys: typeof _getApplePublicKeys;
  _setFetch: typeof _setFetch;
};

export default _exports;
