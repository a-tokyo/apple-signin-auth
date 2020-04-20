/* @flow */
/* eslint-disable import/no-named-as-default-member */

import appleSignin, {
  getAuthorizationUrl,
  getClientSecret,
  getAuthorizationToken,
  refreshAuthorizationToken,
  verifyIdToken,
  _getApplePublicKeys,
} from '../src/index';

describe('appleSignin test', () => {
  it('exposes all neccessary values as default export', () => {
    expect(appleSignin.getAuthorizationUrl).toBeTruthy();
    expect(appleSignin.getClientSecret).toBeTruthy();
    expect(appleSignin.getAuthorizationToken).toBeTruthy();
    expect(appleSignin.refreshAuthorizationToken).toBeTruthy();
    expect(appleSignin.verifyIdToken).toBeTruthy();
    expect(appleSignin._getApplePublicKeys).toBeTruthy();
  });

  it('exposes all neccessary values as module.exports', () => {
    expect(getAuthorizationUrl).toBeTruthy();
    expect(getClientSecret).toBeTruthy();
    expect(getAuthorizationToken).toBeTruthy();
    expect(refreshAuthorizationToken).toBeTruthy();
    expect(verifyIdToken).toBeTruthy();
    expect(_getApplePublicKeys).toBeTruthy();
  });
});
