/**
 * Tela de Compra Premium — placeholder.
 * Implementação completa na feature/premium (Issue #17).
 *
 * Fluxo completo:
 *   - Exibir benefícios do plano Premium
 *   - Chamar Purchases.purchasePackage() via RevenueCat
 *   - Botão "Restaurar compra" (obrigatório para Play Store)
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Premium() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.emoji}>⭐</Text>
        <Text style={styles.title}>Plano Premium</Text>
        <Text style={styles.benefit}>
          Remova todos os anúncios com uma compra única.
        </Text>
        <Text style={styles.subtitle}>Em breve — Issue #17</Text>

        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={styles.backLabel}>← Voltar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1B4332' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emoji: { fontSize: 64 },
  title: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  benefit: { fontSize: 15, textAlign: 'center', lineHeight: 22, color: 'rgba(255,255,255,0.7)' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  backBtn: { marginTop: 24 },
  backLabel: { fontSize: 15, fontWeight: '600', color: '#FFD700' },
});
