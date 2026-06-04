import { expectType, expectError } from 'tsd';
import appleAuth, {
  getAuthorizationUrl,
  getAuthorizationToken,
  getClientSecret,
  refreshAuthorizationToken,
  revokeAuthorizationToken,
  verifyIdToken,
  _getApplePublicKeys,
  _setFetch,
  AppleAuthorizationTokenResponseType,
  AppleIdTokenType,
} from './index';

// getAuthorizationUrl
expectType<string>(getAuthorizationUrl({ clientID: '', redirectUri: '' }));
getAuthorizationUrl({
  clientID: '',
  redirectUri: '',
  responseMode: 'form_post',
  scope: '',
  state: '',
});
expectError(getAuthorizationUrl());

// getAuthorizationToken
expectType<Promise<AppleAuthorizationTokenResponseType>>(
  getAuthorizationToken('', {
    clientID: '',
    clientSecret: '',
    redirectUri: 'https://example.com',
  }),
);
expectError(getAuthorizationToken('', { clientID: '', clientSecret: '' }));

// getClientSecret
expectType<string>(
  getClientSecret({
    clientID: '',
    keyIdentifier: '',
    teamID: '',
    expAfter: 500,
    privateKey: '',
    privateKeyPath: '',
  }),
);
expectError(getClientSecret());
expectError(getClientSecret({ clientID: '', teamID: '' }));
getClientSecret({ clientID: '', keyIdentifier: '', teamID: '' });
expectError(
  getClientSecret({
    clientID: '',
    keyIdentifier: '',
    teamID: '',
    expAfter: '500',
  }),
);
getClientSecret({ clientID: '', keyIdentifier: '', teamID: '', expAfter: 500 });

// refreshAuthorizationToken
expectType<Promise<AppleAuthorizationTokenResponseType>>(
  refreshAuthorizationToken('', { clientID: '', clientSecret: '' }),
);
expectError(refreshAuthorizationToken('', { clientID: '' }));
expectError(refreshAuthorizationToken(''));

// revokeAuthorizationToken
expectType<Promise<any>>(
  revokeAuthorizationToken('', {
    clientID: '',
    clientSecret: '',
    tokenTypeHint: 'refresh_token',
  }),
);
expectType<Promise<any>>(
  revokeAuthorizationToken('', {
    clientID: '',
    clientSecret: '',
    tokenTypeHint: 'access_token',
  }),
);
expectError(
  revokeAuthorizationToken('', {
    clientID: '',
    clientSecret: '',
    tokenTypeHint: '',
  }),
);
expectError(revokeAuthorizationToken('', { clientID: '', clientSecret: '' }));
expectError(revokeAuthorizationToken('', { clientID: '' }));
expectError(revokeAuthorizationToken(''));

// verifyIdToken
expectType<Promise<AppleIdTokenType>>(verifyIdToken(''));
verifyIdToken('', { foo: 'bar' });

// _setFetch
_setFetch(() => {});
expectError(_setFetch(''));

// _getApplePublicKeys
expectType<Promise<string[]>>(_getApplePublicKeys());
_getApplePublicKeys({ disableCaching: true });

// default export shape
expectType<typeof getAuthorizationUrl>(appleAuth.getAuthorizationUrl);
expectType<typeof getAuthorizationToken>(appleAuth.getAuthorizationToken);
expectType<typeof getClientSecret>(appleAuth.getClientSecret);
expectType<typeof verifyIdToken>(appleAuth.verifyIdToken);
expectType<typeof refreshAuthorizationToken>(
  appleAuth.refreshAuthorizationToken,
);
expectType<typeof _getApplePublicKeys>(appleAuth._getApplePublicKeys);
expectType<typeof _setFetch>(appleAuth._setFetch);
