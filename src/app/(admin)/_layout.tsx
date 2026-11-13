import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  BookMarked,
  Users,
  TicketPercent,
  Megaphone,
  LogOut,
  UserCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth-store';
import { useToastStore } from '../../store/toast-store';
import { useAccessibilityStore } from '../../store/accessibility-store';
import { useLogout } from '../../api/generated/endpoints/auth-controller/auth-controller';
import { ProfileModal } from '../../components/shared/ProfileModal';

export default function AdminLayout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const logoutStore = useAuthStore((state) => state.logout);
  const showToast = useToastStore((state) => state.showToast);
  const { darkMode, highContrast } = useAccessibilityStore();
  const logoutMutation = useLogout();

  const [perfilVisivel, setPerfilVisivel] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Prossegue com logout local
    }
    queryClient.clear();
    await logoutStore();
    showToast({
      type: 'success',
      title: 'Sessão Admin encerrada',
      message: 'Até logo!',
    });
    router.replace('/(auth)/login');
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: highContrast ? '#000000' : '#111827' },
          headerTintColor: highContrast ? '#ffb400' : '#ffffff',
          headerTitleStyle: { fontFamily: 'Poppins_700Bold', fontSize: 17 },
          tabBarActiveTintColor: highContrast
            ? '#ffb400'
            : darkMode
            ? '#ff4d63'
            : '#b30016',
          tabBarInactiveTintColor: darkMode || highContrast ? '#94a3b8' : '#6b7280',
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            height: 62 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 10),
            paddingTop: 6,
            backgroundColor: highContrast
              ? '#000000'
              : darkMode
              ? '#1e293b'
              : '#ffffff',
            borderTopColor: highContrast
              ? '#ffb400'
              : darkMode
              ? '#334155'
              : '#f3f4f6',
          },
          tabBarLabelStyle: {
            fontFamily: 'Poppins_600SemiBold',
            fontSize: 10,
          },
          headerRight: () => (
            <View className="flex-row items-center mr-3">
              <TouchableOpacity
                onPress={() => setPerfilVisivel(true)}
                className="p-2 mr-1"
              >
                <UserCircle color="#ffb400" size={22} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} className="p-2">
                <LogOut color="#ffb400" size={20} />
              </TouchableOpacity>
            </View>
          ),
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Admin • Painel Geral',
            tabBarLabel: 'Painel',
            tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="cursos"
          options={{
            title: 'Admin • Cursos (/all)',
            tabBarLabel: 'Cursos',
            tabBarIcon: ({ color, size }) => <BookMarked color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="usuarios"
          options={{
            title: 'Admin • Usuários & Matrícula',
            tabBarLabel: 'Matricular',
            tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="marketing"
          options={{
            title: 'Admin • Cupons & Promoções',
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

      <ProfileModal
        visible={perfilVisivel}
        onClose={() => setPerfilVisivel(false)}
      />
    </>
  );
}