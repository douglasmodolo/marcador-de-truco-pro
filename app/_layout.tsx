import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider } from '@/context/ThemeContext';
import { useTheme } from '@/hooks/useTheme';

// ---------------------------------------------------------------------------
// AppNavigator — acessa o tema do ThemeProvider acima para reagir a mudanças.
// Separado de RootLayout para poder consumir o Context sem criar um ciclo.
// ---------------------------------------------------------------------------
function AppNavigator() {
  const { theme, activeKey } = useTheme();

  return (
    <>
      {/* StatusBar muda de estilo junto com o tema ativo */}
      <StatusBar
        style={activeKey === 'dark' ? 'light' : 'dark'}
        backgroundColor={theme.background}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          // contentStyle garante que o fundo entre animações use a cor certa
          contentStyle: { backgroundColor: theme.background },
          animation: 'fade',
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// RootLayout — providers raiz do app
// ---------------------------------------------------------------------------
export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1">
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
