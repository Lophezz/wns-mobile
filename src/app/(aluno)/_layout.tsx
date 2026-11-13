import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpen, GraduationCap, Bell, LogOut, UserCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth-store';
import { useToastStore } from '../../store/toast-store';
import { useAccessibilityStore } from '../../store/accessibility-store';
import { useLogout } from '../../api/generated/endpoints/auth-controller/auth-controller';
import { ProfileModal } from '../../components/shared/ProfileModal';

export default function AlunoLayout() {
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
      // Prossegue com logout local mesmo se falhar na rede
    }
    queryClient.clear();
    await logoutStore();
    showToast({
      type: 'success',
      title: 'Sessão encerrada',
      message: 'Você saiu da sua conta com segurança.',
    });
    router.replace('/(auth)/login');
  };

  const iconColor = highContrast ? '#ffb400' : '#ffffff';

  return (
    <>
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: highContrast
              ? '#000000'
              : darkMode
              ? '#1e293b'
              : '#b30016',
          },
          headerTintColor: iconColor,
          headerTitleStyle: { fontFamily: 'Poppins_700Bold', fontSize: 18 },
          tabBarActiveTintColor: highContrast
            ? '#ffb400'
            : darkMode
            ? '#ff4d63'
            : '#b30016',
          tabBarInactiveTintColor: darkMode || highContrast ? '#94a3b8' : '#9ca3af',
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            height: 60 + insets.bottom,
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
            fontSize: 11,
          },
          headerRight: () => (
            <View className="flex-row items-center mr-3">
              <TouchableOpacity
                onPress={() => setPerfilVisivel(true)}
                className="p-2 mr-1"
              >
                <UserCircle color={iconColor} size={22} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} className="p-2">
                <LogOut color={iconColor} size={20} />
              </TouchableOpacity>
            </View>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Cursos WNS',
            tabBarLabel: 'Catálogo',
            tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="minhas-matriculas"
          options={{
            title: 'Meus Estudos',
            tabBarLabel: 'Matrículas',
            tabBarIcon: ({ color, size }) => <GraduationCap color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="mural"
          options={{
            title: 'Mural & Dúvidas',
            tabBarLabel: 'Mural / FAQ',
            tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="curso/[id]"
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: { display: 'none' },
            title: 'Detalhes do Curso',
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