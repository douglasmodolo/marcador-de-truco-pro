import { View, Text } from 'react-native';

/**
 * Tela de verificação de setup.
 * Será substituída pelo Menu Principal na feature/menu-principal.
 *
 * Se você ver "Olá Truco 🃏" em fundo preto com texto branco,
 * o NativeWind e o Expo Router estão configurados corretamente.
 */
export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <Text className="text-white text-5xl font-bold mb-3">🃏</Text>
      <Text className="text-white text-3xl font-bold mb-2">Olá Truco!</Text>
      <Text className="text-white/50 text-base text-center px-8">
        Setup OK — Expo Router v6 + NativeWind v4 + SDK 54
      </Text>
    </View>
  );
}
