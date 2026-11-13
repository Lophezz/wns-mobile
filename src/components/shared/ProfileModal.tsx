import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  User,
  Lock,
  X,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react-native";
import { useAuthStore } from "../../store/auth-store";
import { useToastStore } from "../../store/toast-store";
import { useResetPassword } from "../../api/generated/endpoints/auth-controller/auth-controller";

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ProfileModal({ visible, onClose }: ProfileModalProps) {
  const { email, role } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);
  const resetPasswordMutation = useResetPassword();

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleAlterarSenha = async () => {
    if (novaSenha.trim().length < 6) {
      showToast({
        type: "warning",
        title: "Senha muito curta",
        message: "A nova senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      showToast({
        type: "warning",
        title: "Senhas diferentes",
        message: "A confirmação de senha não confere com a nova senha.",
      });
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        data: {
          email: email || "",
          senha: novaSenha.trim(),
          password: novaSenha.trim(),
        } as any,
      });
      showToast({
        type: "success",
        title: "Senha Atualizada!",
        message: "Sua nova senha já está valendo para os próximos acessos.",
      });
      setNovaSenha("");
      setConfirmarSenha("");
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Não foi possível alterar sua senha no momento.";
      showToast({
        type: "error",
        title: "Erro ao alterar senha",
        message: msg,
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mr-3">
                <User size={20} color="#b30016" />
              </View>
              <View>
                <Text className="text-lg font-poppins-bold text-gray-900">
                  Meu Perfil
                </Text>
                <Text className="text-xs font-poppins text-gray-500">
                  Conta verificada WNS School
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Dados da Conta */}
          <View className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-5">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs font-poppins text-gray-500 uppercase">
                E-mail conectado
              </Text>
              <View className="bg-red-50 px-2.5 py-0.5 rounded-full flex-row items-center">
                <ShieldCheck size={12} color="#b30016" />
                <Text className="text-[11px] font-poppins-bold text-brand ml-1">
                  {role === "ADMIN" ? "ADMINISTRADOR" : "ALUNO"}
                </Text>
              </View>
            </View>
            <Text className="text-sm font-poppins-bold text-gray-900">
              {email || "Usuário autenticado"}
            </Text>
          </View>

          {/* Alterar Senha Logado (POST /auth/reset-password) */}
          <Text className="text-xs font-poppins-bold text-gray-800 uppercase mb-2">
            Alterar Minha Senha
          </Text>

          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 mb-3">
            <Lock size={18} color="#6b7280" />
            <TextInput
              placeholder="Digite a nova senha (mín. 6 caracteres)"
              secureTextEntry={!mostrarSenha}
              value={novaSenha}
              onChangeText={setNovaSenha}
              className="flex-1 ml-2.5 font-poppins text-sm text-gray-900"
            />
            <TouchableOpacity onPress={() => setMostrarSenha((v) => !v)}>
              {mostrarSenha ? (
                <EyeOff size={18} color="#6b7280" />
              ) : (
                <Eye size={18} color="#6b7280" />
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 mb-5">
            <CheckCircle2 size={18} color="#6b7280" />
            <TextInput
              placeholder="Confirme a nova senha"
              secureTextEntry={!mostrarSenha}
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              className="flex-1 ml-2.5 font-poppins text-sm text-gray-900"
            />
          </View>

          <TouchableOpacity
            onPress={handleAlterarSenha}
            disabled={resetPasswordMutation.isPending}
            className="bg-brand py-4 rounded-xl items-center mb-2"
          >
            {resetPasswordMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-poppins-bold text-sm">
                SALVAR NOVA SENHA
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
