import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import OTPTextView from "react-native-otp-textinput";
import { ArrowLeft, Mail, Lock, KeyRound } from "lucide-react-native";
import {
  useRequestPassword,
  useResetPassword1 as useConfirmPasswordReset,
} from "../../api/generated/endpoints/auth-controller/auth-controller";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const requestMutation = useRequestPassword();
  const resetMutation = useConfirmPasswordReset();

  const handleRequestCode = async () => {
    if (!email.trim().includes("@")) {
      Alert.alert("Atenção", "Digite um e-mail válido.");
      return;
    }

    try {
      await requestMutation.mutateAsync({ data: { email: email.trim() } });
      Alert.alert(
        "Código enviado!",
        "Verifique sua caixa de entrada. O código expira em 8 minutos.",
      );
      setStep(2);
    } catch (error) {
      Alert.alert(
        "Erro",
        "Não foi possível enviar o código. Verifique se o e-mail está correto.",
      );
    }
  };

  const handleResetPassword = async () => {
    if (code.length !== 6 || newPassword.length < 6) {
      Alert.alert(
        "Atenção",
        "Digite o código de 6 dígitos e uma nova senha com no mínimo 6 caracteres.",
      );
      return;
    }

    try {
      await resetMutation.mutateAsync({
        data: {
          email: email.trim(),
          code,
          newPassword,
        },
      });
      Alert.alert(
        "Senha atualizada!",
        "Sua senha foi redefinida com sucesso.",
        [
          {
            text: "Fazer Login",
            onPress: () => router.replace("/(auth)/login"),
          },
        ],
      );
    } catch (error) {
      Alert.alert("Erro", "Código inválido ou expirado.");
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View className="bg-brand pt-16 pb-10 px-6 rounded-b-3xl">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-white/15 rounded-xl items-center justify-center mb-4"
        >
          <ArrowLeft color="#ffffff" size={22} />
        </TouchableOpacity>
        <View className="flex-row items-center gap-3">
          <KeyRound color="#ffb400" size={28} />
          <Text className="text-white text-2xl font-poppins-bold">
            Recuperar Senha
          </Text>
        </View>
        <Text className="text-white/85 text-sm font-poppins mt-1">
          {step === 1
            ? "Informe seu e-mail para receber o código de segurança."
            : "Digite o código recebido e defina sua nova senha."}
        </Text>
      </View>

      <View className="px-6 -mt-5">
        <View className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          {step === 1 ? (
            <>
              <Text className="text-xs font-poppins-semibold text-gray-700 mb-1.5 uppercase">
                Seu E-mail cadastrado
              </Text>
              <View className="flex-row items-center border border-gray-200 rounded-xl px-3.5 py-3 bg-gray-50 mb-6">
                <Mail size={20} color="#6b7280" />
                <TextInput
                  placeholder="seu@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 ml-3 font-poppins text-gray-900 text-base"
                />
              </View>

              <TouchableOpacity
                onPress={handleRequestCode}
                disabled={requestMutation.isPending}
                className="bg-brand py-4 rounded-xl items-center"
              >
                {requestMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-poppins-bold text-base">
                    ENVIAR CÓDIGO
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text className="text-xs font-poppins-semibold text-gray-700 mb-2 uppercase">
                Código de Segurança (6 dígitos)
              </Text>
              <OTPTextView
                handleTextChange={setCode}
                inputCount={6}
                tintColor="#b30016"
                offTintColor="#e5e7eb"
                containerStyle={{ marginBottom: 20 }}
                textInputStyle={{
                  borderRadius: 10,
                  borderWidth: 2,
                  borderBottomWidth: 2,
                  width: 44,
                  height: 52,
                }}
              />

              <Text className="text-xs font-poppins-semibold text-gray-700 mb-1.5 uppercase">
                Nova Senha
              </Text>
              <View className="flex-row items-center border border-gray-200 rounded-xl px-3.5 py-3 bg-gray-50 mb-6">
                <Lock size={20} color="#6b7280" />
                <TextInput
                  placeholder="Mínimo de 6 caracteres"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  className="flex-1 ml-3 font-poppins text-gray-900 text-base"
                />
              </View>

              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={resetMutation.isPending}
                className="bg-brand py-4 rounded-xl items-center"
              >
                {resetMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-poppins-bold text-base">
                    REDEFINIR SENHA
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
