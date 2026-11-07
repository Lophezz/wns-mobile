import React from "react";
import { Tabs, useRouter } from "expo-router";
import { TouchableOpacity, Alert } from "react-native";
import {
  LayoutDashboard,
  BookOpenCheck,
  Users,
  TicketPercent,
  Megaphone,
  LogOut,
} from "lucide-react-native";
import { useAuthStore } from "../../store/auth-store";
import { useLogout } from "../../api/generated/endpoints/auth-controller/auth-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AdminLayout() {
  const router = useRouter();
  const logoutStore = useAuthStore((state) => state.logout);
  const logoutMutation = useLogout();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert(
      "Terminar Sessão (Admin)",
      "Deseja sair do painel administrativo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              await logoutMutation.mutateAsync();
            } catch {
              // Prossegue com logout local
            }
            await logoutStore();
            router.replace("/(auth)/login");
          },
        },
      ],
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#111827" }, // Cabeçalho escuro para diferenciar o modo Admin
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontFamily: "Poppins_700Bold", fontSize: 17 },
        tabBarActiveTintColor: "#b30016",
        tabBarInactiveTintColor: "#6b7280",
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 6,
          backgroundColor: "#ffffff",
          borderTopColor: "#f3f4f6",
        },
        tabBarLabelStyle: {
          fontFamily: "Poppins_600SemiBold",
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
          title: "Admin • Matrículas",
          tabBarLabel: "Painel",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="cursos"
        options={{
          title: "Admin • Cursos (/all)",
          tabBarLabel: "Cursos",
          tabBarIcon: ({ color, size }) => (
            <BookOpenCheck color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="usuarios"
        options={{
          title: "Admin • Utilizadores",
          tabBarLabel: "Matricular",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="marketing"
        options={{
          title: "Admin • Promo & Cupões",
          tabBarLabel: "Marketing",
          tabBarIcon: ({ color, size }) => (
            <TicketPercent color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="comunicacao"
        options={{
          title: "Admin • Avisos & FAQ",
          tabBarLabel: "Mural",
          tabBarIcon: ({ color, size }) => (
            <Megaphone color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
