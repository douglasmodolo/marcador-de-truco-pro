import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// ---------------------------------------------------------------------------
// RootLayout — providers raiz do app
// ThemeProvider removido: o app usa fundo verde fixo (#1B4332 → #2D6A4F).
// ---------------------------------------------------------------------------
export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1">
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1B4332' },
          animation: 'fade',
        }}
      />
    </GestureHandlerRootView>
  );
}
