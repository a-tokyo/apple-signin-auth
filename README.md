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
  privateKey: 'PRIVATE_KEY_STRING', // private key associated with your client ID. -- Or provide a `privateKeyPath` property instead.
  keyIdentifier: 'XXX', // identifier of the private key.
  // OPTIONAL
  expAfter: 15777000, // Unix time in seconds after which to expire the clientSecret JWT. Default is now+5 minutes.
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
  privateKey: 'PRIVATE_KEY_STRING', // private key associated with your client ID. -- Or provide a `privateKeyPath` property instead.
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

### 5. a, Revoke tokens with refresh_token
```js

const clientSecret = appleSignin.getClientSecret({
  clientID: 'com.company.app', // Apple Client ID
  teamID: 'teamID', // Apple Developer Team ID.
  privateKey: 'PRIVATE_KEY_STRING', // private key associated with your client ID. -- Or provide a `privateKeyPath` property instead.
  keyIdentifier: 'XXXXXXXXXX', // identifier of the private key. - can be found here https://developer.apple.com/account/resources/authkeys/list
  // OPTIONAL
  expAfter: 15777000, // Duration after which to expire JWT
});

const options = {
  clientID: 'com.company.app', // Apple Client ID
  clientSecret,
  tokenTypeHint: 'refresh_token'
};

try {
  await appleSignin.revokeAuthorizationToken(refreshToken, options);
} catch (err) {
  console.error(err);
}
```

### 5. b, Revoke tokens with access_token
```js

const clientSecret = appleSignin.getClientSecret({
  clientID: 'com.company.app', // Apple Client ID
  teamID: 'teamID', // Apple Developer Team ID.
  privateKey: 'PRIVATE_KEY_STRING', // private key associated with your client ID. -- Or provide a `privateKeyPath` property instead.
  keyIdentifier: 'XXXXXXXXXX', // identifier of the private key. - can be found here https://developer.apple.com/account/resources/authkeys/list
  // OPTIONAL
  expAfter: 15777000, // Duration after which to expire JWT
});

const options = {
  clientID: 'com.company.app', // Apple Client ID
  clientSecret,
  tokenTypeHint: 'access_token'
};

try {
  await appleSignin.revokeAuthorizationToken(accessToken, options);
} catch (err) {
  console.error(err);
}
```

### Optional: Server-to-Server Notifications

Apple provides realtime server-to-server notifications of several user lifecycle
events:

- `email-disabled`: The user hides their email behind Apple's private email
  relay, and has opted to stop having emails forwarded by the private relay
  service.
- `email-enabled`: The user hides their email behind Apple's private email
  relay, and has opted to resume having emails forwarded by the private relay
  service.
- `consent-revoked`: The user has decided to stop using Apple ID with your
  application, e.g. by disconnecting the application from Settings. This should
  be treated as a sign-out out by the user.
- `account-delete`: The user has asked Apple to permanently delete their Apple
  ID. The user identifier is no longer valid.

Notifications are sent for each app group.

The notification is sent as a `POST` request with a JSON body. The request body
contains a JWT, with the event description on the JWT payload.

```json
{
  "payload": "<server-to-server notification JWT>"
}
```

To receive these notifications, you must do the following steps.

#### 1. Host the webhook

```js
app.get("/apple-signin-webhook", async (req, res) => {
  try {
    const { events } = await appleSignin.verifyWebhookToken(
      req.body.payload,
      {
        // Optional Options for further verification - Full list can be found here https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
        audience: 'com.company.app', // client id - can also be an array
      },
    );
    const {
      sub: userAppleId,
      type,
      email // Only provided for email events
    } = events;

    switch (type) {
      case 'email-disabled':
        // Email will no longer be forwarded to the user via the private relay service
        break;
      case 'email-enabled':
        // Email will be forwarded to the user again
        break;
      case 'consent-revoked':
        // The user has decided to stop using Apple ID with this application - log them out
        break;
      case 'account-delete':
        // The user has deleted their Apple ID
        break;
    }

    res.sendStatus(200);
} catch (e) {
  // Event token is not verified
  console.error(err)
  res.sendStatus(500);
});
```

Note:

- TLS 1.2 is required to receive notifications at the specified endpoint.

#### 2. Configure the webhook URL in the Apple Developer console

2.1. Sign in to Apple Developer, go to "Certificates, Identifiers & Profiles",
and select the Primary App ID for your application.

2.2 Enable the "Sign in with Apple" capability (if not already enabled) and
click "Configure" (or "Edit").

2.3 Under "Server to Server Notification Endpoint", enter the fully-qualified
URL for your webhook, e.g. `https://example.com/api/apple-signin-webhook`,
and save the changes.

Notes:

- A server-to-server webhook can only be configured for a Primary App ID.
- The Apple docs for this step are located [here](https://help.apple.com/developer-account/?lang=en#/dev217f824b6).

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
