# apple-signin-auth

 Apple signin for Node.js.

<a href="https://npmjs.com/package/apple-signin-auth">
  <img src="https://img.shields.io/npm/v/apple-signin-auth.svg"></img>
  <img src="https://img.shields.io/npm/dt/apple-signin-auth.svg"></img>
</a>
<a href="https://twitter.com/intent/follow?screen_name=ahmad_tokyo"><img src="https://img.shields.io/twitter/follow/ahmad_tokyo.svg?label=Follow%20@ahmad_tokyo" alt="Follow @ahmad_tokyo"></img></a>


## Prerequisites
1. You should be enrolled in [Apple Developer Program](https://developer.apple.com/programs/).
2. Please have a look at [Apple documentation](
https://developer.apple.com/sign-in-with-apple/get-started/) related to "Sign in with Apple" feature.
3. You should create App ID and Service ID in your Apple Developer Account.
4. You should generate private key for your Service ID in your Apple Developer Account.

## Apple Signin Setup
Deatiled confuguration instructions can be found at [blog post](https://medium.com/@artyomefremov/add-sign-in-with-apple-button-to-your-website-today-part-1-12ed1444623a?postPublishedType=initial) and [Apple docs](https://help.apple.com/developer-account/#/dev1c0e25352).

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
  responseMode: 'query' | 'fragment' | 'form_post', // Force set to form_post if scope includes 'email'
  scope: 'email' // optional
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
  teamID: 'teamID', // Apple Developer Team ID.
  privateKey: 'PRIVATE_KEY_STRING', // path to private key associated with your client ID. -- Can also be `privateKeyPath` string
  keyIdentifier: 'XXX' // identifier of the private key.
});

const options = {
  clientID: 'com.company.app', // Apple Client ID
  redirectUri: 'http://localhost:3000/auth/apple/callback', // use the same value which you passed to authorisation URL.
  clientSecret: clientSecret
};

try {
  const tokenResponse = await appleSignin.getAuthorizationToken(code, options);
} catch (err) {
  console.error(err);
}
```

Result of ```getAuthorizationToken``` command is a JSON object representing Apple's [TokenResponse](https://developer.apple.com/documentation/signinwithapplerestapi/tokenresponse):
```js
{
    access_token: 'ACCESS_TOKEN', // A token used to access allowed data.
    token_type: 'Bearer', // It will always be Bearer.
    expires_in: 300, // The amount of time, in seconds, before the access token expires.
    refresh_token: 'REFRESH_TOKEN', // used to regenerate new access tokens. Store this token securely on your server.
    id_token: 'ID_TOKEN' // A JSON Web Token that contains the user’s identity information.
}
```

### 3. Verify token signature and get unique user's identifier
```js
try {
  const { sub: userAppleId } = await appleSignin.verifyIdToken(tokenResponse.id_token, {
    // Optional Options for further verification - Full list can be found here https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
    audience: 'com.company.app', // client id - can also be an array
    nonce: 'NONCE', // nonce // Check this note if coming from React Native AS RN automatically SHA256-hashes the nonce https://github.com/invertase/react-native-apple-authentication#nonce
    // If you want to handle expiration on your own, or if you want the expired tokens decoded
    ignoreExpiration: true, // default is false
  });
} catch (err) {
  // Token is not verified
  console.error(err);
}
```

### 4. Refresh access token after expiration
```js

const clientSecret = appleSignin.getClientSecret({
  clientID: 'com.company.app', // Apple Client ID
  teamID: 'teamID', // Apple Developer Team ID.
  privateKeyPath: '/var/www/app/AuthKey_XXXXXXXXXX.p8', // path to private key associated with client ID. -- Can also be `privateKey` string
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

### Extra API functions
- _setFetch: `(fetchFn: function) => void` - Sets the fetch function, defaults to node-fetch. eg: appleSigninAuth._setFetch(fetchWithProxy);

## Extras
- Handles apple public keys switching solving this issue https://forums.developer.apple.com/thread/129047
- Caches Apple's public keys and only refetches when needed
- ES6 (Can be imported using `import appleSigning from 'apple-signin-auth/src'`)
- Flow and TypeScript Types

## Related Projects
- [Apple Signin for web (React/Vue)](https://github.com/A-Tokyo/react-apple-signin)
- [Apple Signin for React Native](https://github.com/invertase/react-native-apple-authentication)

## Helpful resources
- [React Native: Sign in with Apple by Ross Bulat](https://medium.com/@rossbulat/react-native-sign-in-with-apple-75733d3fbc3)
- [Web: Signin with Apple](https://dev.to/onygami/how-to-add-signin-with-apple-on-your-website-43m9)
  - Note that the frontend implementation can be replaced with [Apple Signin for web (React/Vue)](https://github.com/A-Tokyo/react-apple-signin).


## Contributing
Pull requests are highly appreciated! For major changes, please open an issue first to discuss what you would like to change.

## Support
Feel free to <a href="mailto:ahmed.tokyo1@gmail.com?subject=Apple Signin Contact">contact me directly</a> with questions or consultancy requests.
