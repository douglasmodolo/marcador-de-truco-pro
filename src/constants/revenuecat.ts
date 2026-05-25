/**
 * Configuração do RevenueCat (react-native-purchases).
 *
 * API_KEY_ANDROID: chave pública do projeto no RevenueCat.
 *   - Lida do .env via EXPO_PUBLIC_REVENUECAT_API_KEY.
 *   - A chave pública (prefixo "appl_" ou "goog_") pode ficar em .env.example;
 *     NÃO é a chave secreta — ela é segura para embutir no app.
 *
 * ENTITLEMENT_ID: ID do entitlement configurado no dashboard do RevenueCat.
 *   - Crie em: https://app.revenuecat.com → seu projeto → Entitlements → "premium"
 */
export const REVENUECAT = {
  API_KEY_ANDROID: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY!,
  ENTITLEMENT_ID: 'premium',
};
