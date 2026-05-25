/**
 * app.config.js — configuração dinâmica do Expo.
 *
 * Este arquivo estende o app.json estático e injeta valores de
 * variáveis de ambiente (definidas em .env) em tempo de build.
 *
 * O Expo CLI carrega automaticamente o .env antes de ler este arquivo
 * (SDK 49+), portanto process.env.EXPO_PUBLIC_* já estão disponíveis aqui.
 *
 * @param {{ config: import('expo/config').ExpoConfig }} ctx
 * @returns {import('expo/config').ExpoConfig}
 */
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    // Mantém todos os plugins estáticos do app.json (expo-router, expo-audio, etc.)
    ...(config.plugins ?? []),

    // Plugin do AdMob: lê o App ID do .env; cai no ID de teste se não definido.
    // ⚠️  androidAppId e iosAppId são IDs de APLICATIVO (formato: ca-app-pub-xxx~yyy),
    //     diferentes dos IDs de banner/interstitial (formato: ca-app-pub-xxx/yyy).
    [
      'react-native-google-mobile-ads',
      {
        androidAppId:
          process.env.EXPO_PUBLIC_ADMOB_APP_ID ??
          'ca-app-pub-3940256099942544~3347511713', // fallback: ID de teste do Google
        iosAppId:
          process.env.EXPO_PUBLIC_ADMOB_APP_ID ??
          'ca-app-pub-3940256099942544~1458002511', // fallback: ID de teste do Google
      },
    ],
  ],
});
