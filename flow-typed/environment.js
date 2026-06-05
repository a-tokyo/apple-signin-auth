// Local environment libdefs.
// Flow bundles only `core.js` and `react.js`, so the Node core modules/globals
// and Jest globals this project relies on must be declared here.

/* eslint-disable */

// --- Node globals ---
declare class URLSearchParams {
  constructor(
    init?: string | Array<[string, string]> | { [string]: string },
  ): void;
  append(name: string, value: string): void;
  toString(): string;
}

// --- Node core modules ---
declare module 'url' {
  declare class URL {
    constructor(input: string, base?: string): void;
    pathname: string;
    searchParams: {
      append(name: string, value: string): void,
      ...
    };
    toString(): string;
  }
  declare module.exports: { URL: Class<URL> };
}

declare module 'fs' {
  declare function existsSync(path: string): boolean;
  declare function readFileSync(path: string, encoding: string): string;
}

declare module 'crypto' {
  declare type KeyObject = {
    export(options: { type: string, format: string }): string,
    ...
  };
  declare function createPublicKey(key: {
    key: { kty: string, n: string, e: string },
    format: 'jwk',
  }): KeyObject;
}

// --- Jest globals ---
declare type JestMatchers = {
  toBe(expected: mixed): void,
  toEqual(expected: mixed): void,
  toBeTruthy(): void,
  toBeNull(): void,
  not: JestMatchers,
  ...
};
declare var expect: (actual: mixed) => JestMatchers;
declare var describe: (name: string, fn: () => void) => void;
declare var it: (name: string, fn: () => void | Promise<mixed>) => void;
