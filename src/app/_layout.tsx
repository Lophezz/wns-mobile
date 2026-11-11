import '../../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/auth-store';
import { ToastBanner } from '../components/shared/ToastBanner';
import { FloatingAccessibilityButton } from '../components/shared/FloatingAccessibilityButton';
import { AccessibilityWrapper } from '../components/shared/AccessibilityWrapper'; // <-- Importe o wrapper!

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const syncAuthFromStorage = useAuthStore((state) => state.syncAuthFromStorage);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    syncAuthFromStorage();
  }, []);

  useEffect(() => {
    if (fontsLoaded && isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isHydrated]);

  if (!fontsLoaded || !isHydrated) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        
        {/* Envelopa o App inteiro com a Acessibilidade (Zoom e Filtros) */}
        <AccessibilityWrapper>
          <ToastBanner />
          <Stack screenOptions={{ headerShown: false }} />
        </AccessibilityWrapper>
        
        {/* O botão flutuante fica de fora para não sofrer o Zoom e sair da tela! */}
        <FloatingAccessibilityButton />
        
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}