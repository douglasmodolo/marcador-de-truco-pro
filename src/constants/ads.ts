/**
 * IDs de anúncios do Google AdMob.
 *
 * Em desenvolvimento (__DEV__ = true), usa os IDs de teste oficiais do Google
 * para não impactar métricas reais e evitar banimento da conta.
 *
 * Em produção, lê os IDs reais do .env via EXPO_PUBLIC_ADMOB_*.
 *
 * IDs de teste oficiais: https://developers.google.com/admob/android/test-ads
 */
export const ADS = {
  BANNER_ID: __DEV__
    ? 'ca-app-pub-3940256099942544/6300978111'
    : process.env.EXPO_PUBLIC_ADMOB_BANNER_ID!,
  INTERSTITIAL_ID: __DEV__
    ? 'ca-app-pub-3940256099942544/1033173712'
    : process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID!,
};
