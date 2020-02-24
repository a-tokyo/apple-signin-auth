# apple-signin-auth

🍎 Apple signin for node.

[![npm version](https://badge.fury.io/js/apple-signin-auth.svg)](https://badge.fury.io/js/apple-signin-auth)

## Prerequisites
1. You should be enrolled in [Apple Developer Program](https://developer.apple.com/programs/).
2. Please have a look at [Apple documentation](
https://developer.apple.com/sign-in-with-apple/get-started/) related to "Sign in with Apple" feature.
3. You should create App ID and Service ID in your Apple Developer Account.
4. You should generate private key for your Service ID in your Apple Developer Account.

More detail about configuration can be found in [blog post](https://medium.com/@artyomefremov/add-sign-in-with-apple-button-to-your-website-today-part-1-12ed1444623a?postPublishedType=initial) and [Apple docs](https://help.apple.com/developer-account/#/dev1c0e25352).

## Installation

```bash
npm install --save apple-signin-auth
```
OR
```bash
yarn add apple-signin-auth
```

## Usage

### 1. Get authorization URL
Start "Sign in with Apple" flow by redirecting user to the authorization URL.
```js
import appleSignin from 'apple-signin-auth'; 
// OR const appleSignin = require('apple-signin-auth');
// OR import { getAuthorizationUrl } from 'apple-signin-auth';

const options = {
  clientID: 'com.company.app', // Apple Client ID
  redirectUri: 'http://localhost:3000/auth/apple/callback',
  // OPTIONAL
  state: 'state', // optional, An unguessable random string. It is primarily used to protect against CSRF attacks.
  scope: 'email' // optional, default value is 'email'.
};

const authorizationUrl = appleSignin.getAuthorizationUrl(options);
```
Alternatively, you can use [Sign In with Apple](https://developer.apple.com/documentation/signinwithapplejs) browser javascript library.

### 2. Get access token
2.1. Retrieve "code" query param from URL string when user is redirected to your site after successful sign in with Apple. Example:
http://localhost:3000/auth/apple/callback?code=somecode&state=123.

2.2. Exchange retrieved "code" to user's access token.

More detail can be found in [Apple docs](https://developer.apple.com/documentation/signinwithapplerestapi/generate_and_validate_tokens).

```js

const clientSecret = appleSignin.getClientSecret({
  clientID: 'com.company.app', // Apple Client ID
  teamId: 'teamId', // Apple Developer Team ID.
  privateKeyPath: '/var/www/app/AuthKey_XXX.p8', // path to private key associated with your client ID.
  keyIdentifier: 'XXX' // identifier of the private key.    
});

const options = {
  clientID: 'com.company.app', // Apple Client ID
  redirectUri: 'http://localhost:3000/auth/apple/callback', // use the same value which you passed to authorisation URL.
  clientSecret: clientSecret
};
 
appleSignin.getAuthorizationToken(code, options).then(tokenResponse => {
    console.log(tokenResponse);
}).catch(error => {
    console.log(error);
});
```

Result of ```getAuthorizationToken``` command is a JSON object representing Apple's [TokenResponse](https://developer.apple.com/documentation/signinwithapplerestapi/tokenresponse):
```js
{
    access_token: 'ACCESS_TOKEN', // A token used to access allowed data.
    token_type: 'Bearer', // It will always be Bearer.
    expires_in: 3600, // The amount of time, in seconds, before the access token expires.
    refresh_token: 'REFRESH_TOKEN', // used to regenerate new access tokens. Store this token securely on your server.
    id_token: 'ID_TOKEN' // A JSON Web Token that contains the user’s identity information.
}
```

### 3. Verify token signature and get unique user's identifier
```js
const clientID = 'com.company.app'; // or ['com.company.app', 'com.company.app.staging'];
appleSignin.verifyIdToken(tokenResponse.id_token, clientID).then(result => {
    const userAppleId = result.sub;
}).catch(error => {
  // Token is not verified
  console.log(error);
});
```

### 4. Refresh access token after expiration
```js

const clientSecret = appleSignin.getClientSecret({
  clientID: 'com.company.app', // Apple Client ID
  teamId: 'teamId', // Apple Developer Team ID.
  privateKeyPath: '/var/www/app/AuthKey_XXXXXXXXXX.p8', // path to private key associated with client ID.
  keyIdentifier: 'XXXXXXXXXX', // identifier of the private key. - can be found here https://developer.apple.com/account/resources/authkeys/list
  // OPTIONAL
  expAfter: 15777000, // Duration after which to expire JWT
});

const options = {
  clientID: 'com.company.app', // Apple Client ID
  clientSecret
};
 
try {
  const {
    access_token
  } = appleSignin.refreshAuthorizationToken(refreshToken, options);
} catch (err) {
  console.error(err);
}
```

## Extras
- Handles apple public keys switching solving this issue https://forums.developer.apple.com/thread/129047
- Caches Apple's public keys and only refetches when needed
- ES6 (Can be imported using `import appleSigning from 'apple-signin-auth/src'`)
- Flow Types

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Credits
This is highly inspired by https://github.com/Techofficer/node-apple-signin and a merge would b amazing!
