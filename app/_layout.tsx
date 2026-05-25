import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

/**
 * Root Layout — envolve todo o app com os providers necessários.
 *
 * GestureHandlerRootView: obrigatório para react-native-gesture-handler funcionar.
 * Stack: navegação file-based do Expo Router v6.
 * global.css: importado aqui para que o NativeWind aplique as classes Tailwind.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1">
      <StatusBar style="light" backgroundColor="#000000" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
          animation: 'fade',
        }}
      />
    </GestureHandlerRootView>
  );
}
