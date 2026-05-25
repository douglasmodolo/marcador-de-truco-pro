import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Tela index — placeholder para confirmar que o projeto está rodando.
 * Será substituída pelo Menu Principal na issue #4.
 */
export default function IndexScreen() {
  return (
    <SafeAreaView className="flex-1 bg-black items-center justify-center">
      <View className="items-center gap-4">
        <Text className="text-white text-5xl font-bold">🃏</Text>
        <Text className="text-white text-3xl font-bold tracking-widest">
          Olá Truco
        </Text>
        <Text className="text-yellow-400 text-base mt-2">
          Marcador de Truco Pro
        </Text>
        <Text className="text-white/40 text-sm mt-4">
          Setup inicial concluído ✓
        </Text>
      </View>
    </SafeAreaView>
  );
}
