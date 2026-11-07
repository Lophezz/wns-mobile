import React from "react";
import { Tabs, useRouter } from "expo-router";
import { TouchableOpacity, Alert } from "react-native";
import { BookOpen, GraduationCap, Bell, LogOut } from "lucide-react-native";
import { useAuthStore } from "../../store/auth-store";
import { useLogout } from "../../api/generated/endpoints/auth-controller/auth-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AlunoLayout() {
  const router = useRouter();
  const logoutStore = useAuthStore((state) => state.logout);
  const logoutMutation = useLogout();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert("Sair da conta", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await logoutMutation.mutateAsync();
          } catch {
            // Prossegue com logout local mesmo se falhar na rede
          }
          await logoutStore();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#b30016" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontFamily: "Poppins_700Bold", fontSize: 18 },
        tabBarActiveTintColor: "#b30016",
        tabBarInactiveTintColor: "#9ca3af",
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
          fontSize: 11,
        },
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} className="mr-4 p-2">
            <LogOut color="#ffffff" size={20} />
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
      {/* Esconde a rota dinâmica de detalhes da barra de abas */}
      <Tabs.Screen
        name="curso/[id]"
        options={{
          href: null,
          title: "Detalhes do Curso",
        }}
      />
    </Tabs>
  );
}
