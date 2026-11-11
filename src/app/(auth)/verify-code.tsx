import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import OTPTextView from 'react-native-otp-textinput';
import { ShieldCheck, ArrowLeft, Mail } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVerify } from '../../api/generated/endpoints/auth-controller/auth-controller';
import { useToastStore } from '../../store/toast-store';

export default function VerifyCodeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((s) => s.showToast);
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(params.email || '');
  const [codigo, setCodigo] = useState('');
  const verifyMutation = useVerify();

  const handleVerify = async () => {
    if (!email.trim() || codigo.length !== 6) {
      showToast({
        type: 'warning',
        title: 'Atenção',
        message: 'Preencha seu e-mail e o código de 6 dígitos.',
      });
      return;
    }

    try {
      await verifyMutation.mutateAsync({
        data: {
          email: email.trim(),
          codigo,
        },
      });

      showToast({
        type: 'success',
        title: 'Conta ativada!',
        message: 'Sua conta foi verificada com sucesso. Faça seu login.',
      });
      router.replace('/(auth)/login');
    } catch {
      showToast({
        type: 'error',
        title: 'Código inválido',
        message: 'Verifique se digitou corretamente ou se o código de 10 minutos expirou.',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-surface"
    >
      <ScrollView
        className="flex-1 bg-surface"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom, 24) }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{ paddingTop: Math.max(insets.top + 24, 48) }}
          className="bg-brand pb-10 px-6 rounded-b-3xl"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/15 rounded-xl items-center justify-center mb-4"
          >
            <ArrowLeft color="#ffffff" size={22} />
          </TouchableOpacity>
          <View className="flex-row items-center gap-3">
            <ShieldCheck color="#ffb400" size={30} />
            <Text className="text-white text-2xl font-poppins-bold">Ativar Conta</Text>
          </View>
          <Text className="text-white/85 text-sm font-poppins mt-1">
            Digite o código de 6 dígitos enviado para o seu e-mail.
          </Text>
        </View>

        <View className="px-6 -mt-5">
          <View className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <Text className="text-xs font-poppins-semibold text-gray-700 mb-1.5 uppercase">
              Confirme seu E-mail
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

            <Text className="text-xs font-poppins-semibold text-gray-700 mb-2 uppercase">
              Código de Verificação (6 dígitos)
            </Text>
            <OTPTextView
              handleTextChange={setCodigo}
              inputCount={6}
              tintColor="#b30016"
              offTintColor="#e5e7eb"
              containerStyle={{ marginBottom: 24 }}
              textInputStyle={{
                borderRadius: 10,
                borderWidth: 2,
                borderBottomWidth: 2,
                width: 44,
                height: 52,
              }}
            />

            <TouchableOpacity
              onPress={handleVerify}
              disabled={verifyMutation.isPending}
              className={`bg-brand py-4 rounded-xl items-center ${
                verifyMutation.isPending ? 'opacity-70' : ''
              }`}
            >
              {verifyMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-poppins-bold text-base">
                  CONFIRMAR CÓDIGO
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}