module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.web.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            // Stub pour WebView sur web
            'react-native-webview': './src/utils/webview-stub.web.js',
          },
        },
      ],
    ],
  };
};

