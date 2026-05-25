import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Placeholder — Regras do Truco ────────────────────────────────────────
// Implementação completa planejada para versão futura.
// ───────────────────────────────────────────────────────────────────────────

export default function Regras() {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Text style={styles.emoji}>📜</Text>
        <Text style={styles.title}>REGRAS DO TRUCO</Text>
        <Text style={styles.subtitle}>Em breve</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1B4332',
  },
  safe: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'BebasNeue',
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'BebasNeue',
    fontSize: 18,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1,
  },
});
