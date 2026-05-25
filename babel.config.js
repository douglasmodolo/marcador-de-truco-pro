module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // jsxImportSource: 'nativewind' faz o className funcionar sem importar o pragma
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      // Reanimated DEVE ser o último plugin da lista
      'react-native-reanimated/plugin',
    ],
  };
};
