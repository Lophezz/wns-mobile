import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import {
  LayoutDashboard,
  BookOpenCheck,
  Users,
  TicketPercent,
  Megaphone,
  LogOut,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth-store';
import { useToastStore } from '../../store/toast-store';
import { useAccessibilityStore } from '../../store/accessibility-store';
import { useLogout } from '../../api/generated/endpoints/auth-controller/auth-controller';

export default function AdminLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const logoutStore = useAuthStore((state) => state.logout);
  const showToast = useToastStore((state) => state.showToast);
  const highContrast = useAccessibilityStore((state) => state.highContrast);
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Prossegue com logout local mesmo se falhar na rede
    }
    await logoutStore();
    showToast({
      type: 'success',
      title: 'Sessão encerrada',
      message: 'Você saiu do painel administrativo.',
    });
    router.replace('/(auth)/login');
  };

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#111827' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontFamily: 'Poppins_700Bold', fontSize: 17 },
        tabBarActiveTintColor: highContrast ? '#ffb400' : '#b30016',
        tabBarInactiveTintColor: '#6b7280',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 62 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 6,
          backgroundColor: highContrast ? '#111827' : '#ffffff',
          borderTopColor: highContrast ? '#ffb400' : '#f3f4f6',
        },
        tabBarLabelStyle: {
          fontFamily: 'Poppins_600SemiBold',
          fontSize: 10,
        },
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} className="mr-4 p-2">
            <LogOut color="#ffb400" size={20} />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Admin • Matrículas',
          tabBarLabel: 'Painel',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cursos"
        options={{
          title: 'Admin • Cursos (/all)',
          tabBarLabel: 'Cursos',
          tabBarIcon: ({ color, size }) => <BookOpenCheck color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="usuarios"
        options={{
          title: 'Admin • Utilizadores',
          tabBarLabel: 'Matricular',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="marketing"
        options={{
          title: 'Admin • Promo & Cupões',
          tabBarLabel: 'Marketing',
          tabBarIcon: ({ color, size }) => <TicketPercent color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="comunicacao"
        options={{
          title: 'Admin • Avisos & FAQ',
          tabBarLabel: 'Mural',
          tabBarIcon: ({ color, size }) => <Megaphone color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}