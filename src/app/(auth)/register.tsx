import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
// Nota: No AuthController.java o método do /auth/register foi nomeado como resetPassword
import { useResetPassword as useRegisterUser } from '../../api/generated/endpoints/auth-controller/auth-controller';

const registerSchema = z.object({
  nome: z.string().min(3, 'Digite seu nome completo'),
  email: z.string().min(1, 'Digite seu e-mail').email('E-mail inválido'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const registerMutation = useRegisterUser();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerMutation.mutateAsync({ data });
      Alert.alert(
        'Quase lá!',
        'Enviamos um código de 6 dígitos para o seu e-mail. Ele expira em 10 minutos.',
        [
          {
            text: 'Inserir Código',
            onPress: () =>
              router.push({
                pathname: '/(auth)/verify-code',
                params: { email: data.email },
              }),
          },
        ]
      );
    } catch (error: any) {
      if (error?.response?.status === 429) {
        Alert.alert('Aguarde', 'Limite de tentativas excedido. Tente novamente em 1 minuto.');
      } else {
        Alert.alert(
          'Erro no cadastro',
          'Verifique os dados informados ou se este e-mail já está ativo no sistema.'
        );
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-surface"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="bg-brand pt-16 pb-10 px-6 rounded-b-3xl">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/15 rounded-xl items-center justify-center mb-4"
          >
            <ArrowLeft color="#ffffff" size={22} />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-poppins-bold">Criar Conta</Text>
          <Text className="text-white/85 text-sm font-poppins mt-1">
            Comece sua jornada na WNS School
          </Text>
        </View>

        <View className="flex-1 px-6 -mt-5 pb-8">
          <View className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            {/* Nome */}
            <View className="mb-4">
              <Text className="text-xs font-poppins-semibold text-gray-700 mb-1.5 uppercase">
                Nome Completo
              </Text>
              <Controller
                control={control}
                name="nome"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`flex-row items-center border rounded-xl px-3.5 py-3 bg-gray-50 ${
                      errors.nome ? 'border-red-500' : 'border-gray-200'
                    }`}
                  >
                    <User size={20} color="#6b7280" />
                    <TextInput
                      placeholder="Seu nome completo"
                      placeholderTextColor="#9ca3af"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      className="flex-1 ml-3 font-poppins text-gray-900 text-base"
                    />
                  </View>
                )}
              />
              {errors.nome && (
                <Text className="text-red-600 text-xs font-poppins mt-1">
                  {errors.nome.message}
                </Text>
              )}
            </View>

            {/* E-mail */}
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
                      errors.email ? 'border-red-500' : 'border-gray-200'
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

            {/* Senha */}
            <View className="mb-6">
              <Text className="text-xs font-poppins-semibold text-gray-700 mb-1.5 uppercase">
                Senha
              </Text>
              <Controller
                control={control}
                name="senha"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`flex-row items-center border rounded-xl px-3.5 py-3 bg-gray-50 ${
                      errors.senha ? 'border-red-500' : 'border-gray-200'
                    }`}
                  >
                    <Lock size={20} color="#6b7280" />
                    <TextInput
                      placeholder="Mínimo de 6 caracteres"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      className="flex-1 ml-3 font-poppins text-gray-900 text-base"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <EyeOff size={20} color="#6b7280" />
                      ) : (
                        <Eye size={20} color="#6b7280" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.senha && (
                <Text className="text-red-600 text-xs font-poppins mt-1">
                  {errors.senha.message}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={() => handleSubmit(onSubmit)()}
              disabled={registerMutation.isPending}
              className={`bg-brand py-4 rounded-xl items-center ${
                registerMutation.isPending ? 'opacity-70' : ''
              }`}
            >
              {registerMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-poppins-bold text-base">
                  CADASTRAR
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-6 pt-4 border-t border-gray-100">
              <Text className="text-gray-600 font-poppins text-sm">
                Já recebeu um código?{' '}
              </Text>
              <Link href="/(auth)/verify-code" asChild>
                <TouchableOpacity>
                  <Text className="text-brand font-poppins-bold text-sm">
                    Ativar conta
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