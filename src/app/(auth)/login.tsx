import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff, BookOpen } from "lucide-react-native";
import { useLogin } from "../../api/generated/endpoints/auth-controller/auth-controller";
import { useAuthStore } from "../../store/auth-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToastStore } from "../../store/toast-store";

// 1. Esquema de validação compatível com Zod v4
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Digite seu e-mail")
    .email("Formato de e-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const syncAuthFromStorage = useAuthStore(
    (state) => state.syncAuthFromStorage,
  );
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((state) => state.showToast);

  // 2. Hook gerado automaticamente pelo Orval para POST /auth/login
  const loginMutation = useLogin();

  // 3. Configuração do React Hook Form
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync({ data });
      const role = await syncAuthFromStorage(data.email);

      showToast({
        type: "success",
        title: role === "ADMIN" ? "Acesso Administrativo" : "Login realizado!",
        message: `Bem-vindo à WNS School (${role}).`,
      });

      if (role === "ADMIN") {
        router.replace("/(admin)/dashboard");
      } else {
        router.replace("/(aluno)");
      }
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 429) {
        showToast({
          type: "warning",
          title: "Muitas tentativas",
          message: "Aguarde 1 minuto antes de tentar novamente.",
        });
      } else {
        showToast({
          type: "error",
          title: "Falha na autenticação",
          message: "E-mail ou senha incorretos, ou conta ainda não verificada.",
        });
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      style={{ paddingBottom: insets.bottom }}
      className="flex-1 bg-surface"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cabeçalho respeitando a barra de notificações/bateria */}
        <View
          style={{ paddingTop: Math.max(insets.top + 24, 48) }}
          className="bg-brand pb-12 px-6 rounded-b-3xl items-center shadow-lg"
        >
          <View className="w-16 h-16 bg-white/15 rounded-2xl items-center justify-center mb-4 border border-white/20">
            <BookOpen color="#ffb400" size={34} />
          </View>
          <Text className="text-white text-3xl font-poppins-bold tracking-wider">
            WNS SCHOOL
          </Text>
          <Text className="text-white/90 text-sm font-poppins mt-1 text-center">
            Escola de Idiomas e Tecnologia
          </Text>
        </View>

        {/* Card do Formulário */}
        <View className="flex-1 px-6 -mt-6">
          <View className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <Text className="text-xl font-poppins-bold text-gray-900 mb-1">
              Bem-vindo de volta!
            </Text>
            <Text className="text-sm font-poppins text-gray-500 mb-6">
              Acesse sua conta para continuar seus estudos.
            </Text>

            {/* Campo E-mail */}
            <View className="mb-4">
              <Text className="text-xs font-poppins-semibold text-gray-700 mb-1.5 uppercase">
                E-mail
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`flex-row items-center border rounded-xl px-3.5 py-3 bg-gray-50 ${
                      errors.email ? "border-red-500" : "border-gray-200"
                    }`}
                  >
                    <Mail size={20} color="#6b7280" />
                    <TextInput
                      placeholder="seu@email.com"
                      placeholderTextColor="#9ca3af"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      className="flex-1 ml-3 font-poppins text-gray-900 text-base"
                    />
                  </View>
                )}
              />
              {errors.email && (
                <Text className="text-red-600 text-xs font-poppins mt-1">
                  {errors.email.message}
                </Text>
              )}
            </View>

            {/* Campo Senha */}
            <View className="mb-2">
              <Text className="text-xs font-poppins-semibold text-gray-700 mb-1.5 uppercase">
                Senha
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`flex-row items-center border rounded-xl px-3.5 py-3 bg-gray-50 ${
                      errors.password ? "border-red-500" : "border-gray-200"
                    }`}
                  >
                    <Lock size={20} color="#6b7280" />
                    <TextInput
                      placeholder="••••••••"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      className="flex-1 ml-3 font-poppins text-gray-900 text-base"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#6b7280" />
                      ) : (
                        <Eye size={20} color="#6b7280" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text className="text-red-600 text-xs font-poppins mt-1">
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Esqueci minha senha */}
            <TouchableOpacity
              onPress={() => router.push("/(auth)/forgot-password")}
              className="self-end mb-6 py-1"
            >
              <Text className="text-brand font-poppins-semibold text-sm">
                Esqueceu a senha?
              </Text>
            </TouchableOpacity>

            {/* Botão Entrar */}
            <TouchableOpacity
              onPress={() => handleSubmit(onSubmit)()}
              disabled={loginMutation.isPending}
              className={`bg-brand py-4 rounded-xl items-center shadow-sm ${
                loginMutation.isPending ? "opacity-70" : ""
              }`}
            >
              {loginMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-poppins-bold text-base tracking-wide">
                  ENTRAR
                </Text>
              )}
            </TouchableOpacity>

            {/* Link para Cadastro */}
            <View className="flex-row justify-center mt-6 pt-4 border-t border-gray-100">
              <Text className="text-gray-600 font-poppins text-sm">
                Ainda não é aluno?{" "}
              </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text className="text-brand font-poppins-bold text-sm">
                    Criar conta
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
