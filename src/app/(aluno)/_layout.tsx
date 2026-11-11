import React from "react";
import { Tabs, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { BookOpen, GraduationCap, Bell, LogOut } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/auth-store";
import { useToastStore } from "../../store/toast-store";
import { useAccessibilityStore } from "../../store/accessibility-store";
import { useLogout } from "../../api/generated/endpoints/auth-controller/auth-controller";
import { useQueryClient } from "@tanstack/react-query";

export default function AlunoLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const logoutStore = useAuthStore((state) => state.logout);
  const showToast = useToastStore((state) => state.showToast);
  const { darkMode, highContrast } = useAccessibilityStore();
  const isDark = darkMode || highContrast;
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Prossegue com logout local mesmo se falhar na rede
    }
    queryClient.clear();
    await logoutStore();
    showToast({
      type: "success",
      title: "Sessão encerrada",
      message: "Você saiu da sua conta com segurança.",
    });
    router.replace("/(auth)/login");
  };

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: highContrast ? "#111827" : "#b30016" },
        headerTintColor: highContrast ? "#ffb400" : "#ffffff",
        headerTitleStyle: { fontFamily: "Poppins_700Bold", fontSize: 18 },
        tabBarActiveTintColor: highContrast ? "#ffb400" : "#b30016",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 6,
          backgroundColor: highContrast
            ? "#000000"
            : darkMode
              ? "#1e293b"
              : "#ffffff",
          borderTopColor: highContrast
            ? "#ffb400"
            : darkMode
              ? "#334155"
              : "#f3f4f6",
        },
        tabBarLabelStyle: {
          fontFamily: "Poppins_600SemiBold",
          fontSize: 11,
        },
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} className="mr-4 p-2">
            <LogOut color={highContrast ? "#ffb400" : "#ffffff"} size={20} />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Cursos WNS",
          tabBarLabel: "Catálogo",
          tabBarIcon: ({ color, size }) => (
            <BookOpen color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="minhas-matriculas"
        options={{
          title: "Meus Estudos",
          tabBarLabel: "Matrículas",
          tabBarIcon: ({ color, size }) => (
            <GraduationCap color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="mural"
        options={{
          title: "Mural & Dúvidas",
          tabBarLabel: "Mural / FAQ",
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
        }}
      />
      {/* Oculta a tela de detalhes da barra inferior sem travar a navegação */}
      <Tabs.Screen
        name="curso/[id]"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
          title: "Detalhes do Curso",
        }}
      />
    </Tabs>
  );
}
