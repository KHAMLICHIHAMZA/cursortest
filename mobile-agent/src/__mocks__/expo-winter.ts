// Stub for `expo/src/winter` in Jest.
// Expo's WinterCG polyfills trigger Jest runtime issues in this repo.
// For unit tests we don't need those polyfills (Node already provides URL, TextDecoder, etc).

declare global {
  // eslint-disable-next-line no-var
  var __ExpoImportMetaRegistry: { url: string | null } | undefined;
}

if (!globalThis.__ExpoImportMetaRegistry) {
  Object.defineProperty(globalThis, '__ExpoImportMetaRegistry', {
    value: { url: null },
    enumerable: false,
    writable: true,
    configurable: true,
  });
}

export {};

