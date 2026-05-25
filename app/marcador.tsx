/**
 * Tela do Marcador de Pontos — placeholder.
 * Implementação completa nas features:
 *   - feature/marcador-layout     (Issue #6)
 *   - feature/jogo-context        (Issue #7)
 *   - feature/score-half          (Issue #8)
 *   - feature/truco-button        (Issue #9)
 *   - ...
 *
 * Esta tela recebe parâmetros de rota:
 *   /marcador?time1=Nós&time2=Eles
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

export default function Marcador() {
  const { theme } = useTheme();
  const { time1 = 'Nós', time2 = 'Eles' } = useLocalSearchParams<{
    time1: string;
    time2: string;
  }>();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <Text style={styles.emoji}>🃏</Text>
        <Text style={[styles.title, { color: theme.text }]}>Marcador</Text>
        <Text style={[styles.teams, { color: theme.textMuted }]}>
          {time1}  ×  {time2}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Em breve — Issues #6 – #14
        </Text>

        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[styles.backLabel, { color: theme.accent }]}>← Voltar ao Menu</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emoji: { fontSize: 64 },
  title: { fontSize: 22, fontWeight: '700' },
  teams: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  subtitle: { fontSize: 14, marginTop: 4 },
  backBtn: { marginTop: 24 },
  backLabel: { fontSize: 15, fontWeight: '600' },
});
