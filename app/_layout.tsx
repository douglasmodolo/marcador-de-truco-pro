import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import * as SplashScreen from 'expo-splash-screen';

// Mantém o splash screen visível até as fontes carregarem.
SplashScreen.preventAutoHideAsync();

// ---------------------------------------------------------------------------
// RootLayout — providers raiz + carregamento de fontes
// ---------------------------------------------------------------------------
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Alias utilizado em todos os StyleSheets do app
    BebasNeue: BebasNeue_400Regular,
  });

  useEffect(() => {
    // Oculta o splash assim que as fontes estiverem prontas (ou em erro)
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Não renderiza nada enquanto as fontes não estão prontas
  if (!fontsLoaded && !fontError) return null;

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
