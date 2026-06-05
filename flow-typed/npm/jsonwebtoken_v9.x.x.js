// Minimal hand-maintained Flow libdef for jsonwebtoken v9 (sign + verify).
// The latest flow-typed def (v8.5.x) targets Flow <=0.103, relies on the
// deprecated `$Shape` utility, and contains duplicate class declarations — none
// of which type-check on modern Flow. This covers exactly what this library uses.

declare module 'jsonwebtoken' {
  declare type Algorithm =
    | 'HS256'
    | 'HS384'
    | 'HS512'
    | 'RS256'
    | 'RS384'
    | 'RS512'
    | 'ES256'
    | 'ES384'
    | 'ES512'
    | 'PS256'
    | 'PS384'
    | 'PS512'
    | 'none';

  declare class JsonWebTokenError extends Error {
    inner: Error;
  }
  declare class TokenExpiredError extends JsonWebTokenError {
    expiredAt: number;
  }
  declare class NotBeforeError extends JsonWebTokenError {
    date: Date;
  }

  declare type SignOptions = {
    algorithm?: Algorithm,
    expiresIn?: number | string,
    notBefore?: number | string,
    audience?: string | Array<string>,
    issuer?: string | Array<string>,
    jwtid?: string,
    subject?: string,
    keyid?: string,
    noTimestamp?: boolean,
    header?: { ... },
    ...
  };

  declare type VerifyOptions = {
    algorithms?: Array<Algorithm>,
    audience?: string | Array<string>,
    issuer?: string | Array<string>,
    ignoreExpiration?: boolean,
    ignoreNotBefore?: boolean,
    subject?: string | Array<string>,
    clockTolerance?: number,
    maxAge?: string | number,
    clockTimestamp?: number,
    ...
  };

  declare type GetPublicKeyOrSecret = (
    header: { kid: string, ... },
    callback: (err: ?Error, key?: string) => mixed,
  ) => mixed;

  declare type VerifyCallback = (
    err: ?(JsonWebTokenError | NotBeforeError | TokenExpiredError),
    decoded: any,
  ) => mixed;

  declare module.exports: {
    sign(
      payload: string | Buffer | { ... },
      secretOrPrivateKey: string | Buffer,
      options?: SignOptions,
    ): string,
    verify(
      token: string,
      secretOrPublicKey: string | Buffer | GetPublicKeyOrSecret,
      options?: VerifyOptions,
      callback?: VerifyCallback,
    ): void,
    decode(
      token: string,
      options?: { complete?: boolean, json?: boolean, ... },
    ): any,
    JsonWebTokenError: typeof JsonWebTokenError,
    NotBeforeError: typeof NotBeforeError,
    TokenExpiredError: typeof TokenExpiredError,
    ...
  };
}
