// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Workaround for Windows path issue with node:sea
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: false,
  // Exclude .wasm from asset extensions to prevent bundling issues
  assetExts: (config.resolver.assetExts || []).filter((ext) => ext !== 'wasm'),
  // Resolve platform-specific modules
  sourceExts: [...(config.resolver.sourceExts || []), 'web.js', 'web.tsx'],
  // Alias pour exclure WebView sur web
  resolveRequest: (context, moduleName, platform) => {
    // Sur web, rediriger react-native-webview vers un stub
    if (platform === 'web' && moduleName === 'react-native-webview') {
      const path = require('path');
      return {
        filePath: path.resolve(__dirname, 'src/utils/webview-stub.web.js'),
        type: 'sourceFile',
      };
    }
    // Comportement par défaut - utiliser le resolver par défaut
    return context.resolveRequest(context, moduleName, platform);
  },
};

// Configure transformer to ignore .wasm imports on web
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;

