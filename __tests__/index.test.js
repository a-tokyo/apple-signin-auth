/* @flow */

import appleSignin from '../src/index';

describe('appleSignin test', () => {
  it('exposes all neccessary values', () => {
    expect(appleSignin.getAuthorizationUrl).toBeTruthy();
    expect(appleSignin.getClientSecret).toBeTruthy();
    expect(appleSignin.getAuthorizationToken).toBeTruthy();
    expect(appleSignin.refreshAuthorizationToken).toBeTruthy();
    expect(appleSignin.verifyIdToken).toBeTruthy();
    expect(appleSignin._getApplePublicKeys).toBeTruthy();
  });
});
