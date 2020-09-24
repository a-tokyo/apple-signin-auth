import appleAuth, {
  getAuthorizationUrl,
  getAuthorizationToken,
  getClientSecret,
  refreshAuthorizationToken,
  verifyIdToken,
  _getApplePublicKeys,
  _setFetch,
  AppleAuthorizationTokenResponseType,
  AppleIdTokenType,
} from 'apple-signin-auth';

async function test() {
  // $ExpectType string
  getAuthorizationUrl({ clientID: '', redirectUri: '' });

  getAuthorizationUrl({
    clientID: '',
    redirectUri: '',
    responseMode: 'form_post',
    scope: '',
    state: '',
  });

  // $ExpectError
  getAuthorizationUrl();

  const {
    access_token,
    expires_in,
    id_token,
    refresh_token,
    token_type,
  }: AppleAuthorizationTokenResponseType = await getAuthorizationToken('', {
    clientID: '',
    clientSecret: '',
    redirectUri: 'https://example.com',
  });

  // $ExpectError
  getAuthorizationToken('', { clientID: '', clientSecret: '' });

  // $ExpectType string
  getClientSecret({
    clientID: '',
    keyIdentifier: '',
    teamID: '',
    expAfter: 500,
    privateKey: '',
    privateKeyPath: '',
  });

  // $ExpectError
  getClientSecret();

  // $ExpectError
  getClientSecret({
    clientID: '',
    teamID: '',
  });

  getClientSecret({
    clientID: '',
    keyIdentifier: '',
    teamID: '',
  });

  getClientSecret({
    clientID: '',
    keyIdentifier: '',
    teamID: '',
    expAfter: '500', // $ExpectError
  });

  getClientSecret({
    clientID: '',
    keyIdentifier: '',
    teamID: '',
    expAfter: 500,
  });

  // $ExpectType Promise<AppleAuthorizationTokenResponseType>
  refreshAuthorizationToken('', { clientID: '', clientSecret: '' });

  // $ExpectError
  refreshAuthorizationToken('', { clientID: '' });

  // $ExpectError
  refreshAuthorizationToken('');

  const {
    aud,
    email,
    email_verified,
    exp,
    iat,
    iss,
    nonce,
    nonce_supported,
    sub,
  }: AppleIdTokenType = await verifyIdToken('');

  verifyIdToken('', { foo: 'bar' });

  _setFetch(() => {});
  _setFetch(''); // $ExpectError

  // $ExpectType Promise<string[]>
  _getApplePublicKeys();
  _getApplePublicKeys({ disableCaching: true });

  appleAuth.getAuthorizationUrl;
  appleAuth.getAuthorizationToken;
  appleAuth.getClientSecret;
  appleAuth.verifyIdToken;
  appleAuth.refreshAuthorizationToken;
  appleAuth._getApplePublicKeys;
  appleAuth._setFetch;
}
