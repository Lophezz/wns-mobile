import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Search, UserPlus, CheckCircle, XCircle, X } from 'lucide-react-native';
import { usePesquisarUsuarios } from '../../api/generated/endpoints/auth-controller/auth-controller';
import { useListarCursos } from '../../api/generated/endpoints/curso-controller/curso-controller';
import { useMatricularAluno } from '../../api/generated/endpoints/matricula-controller/matricula-controller';
import { formatCurrency } from '../../utils/formatters';

export default function AdminUsuariosScreen() {
  const [emailBusca, setEmailBusca] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState<any | null>(null);
  const [cursoSelecionadoId, setCursoSelecionadoId] = useState<string>('');
  const [codigoCupom, setCodigoCupom] = useState('');

  // GET /auth/pesquisar?email=...
  const { data: pesquisaData, isLoading } = usePesquisarUsuarios({
    email: emailBusca.trim() || undefined,
    pageable: { page: 0, size: 20 },
  } as any);

  const { data: cursosAtivosData } = useListarCursos();
  const matricularMutation = useMatricularAluno();

  const usuarios = Array.isArray((pesquisaData as any)?.content)
    ? (pesquisaData as any).content
    : [];
  const cursosAtivos = Array.isArray(cursosAtivosData) ? cursosAtivosData : [];

  const handleConfirmarMatricula = async () => {
    if (!alunoSelecionado?.id || !cursoSelecionadoId) {
      Alert.alert('Atenção', 'Selecione um curso ativo para matricular o aluno.');
      return;
    }

    try {
      await matricularMutation.mutateAsync({
        data: {
          alunoId: String(alunoSelecionado.id),
          cursoId: cursoSelecionadoId,
          codigoCupom: codigoCupom.trim() ? codigoCupom.trim().toUpperCase() : undefined,
        },
      });

      Alert.alert(
        'Matrícula Confirmada!',
        `O aluno ${alunoSelecionado.email} foi matriculado e recebeu o e-mail de confirmação.`
      );
      setAlunoSelecionado(null);
      setCursoSelecionadoId('');
      setCodigoCupom('');
    } catch (err: any) {
      Alert.alert(
        'Não foi possível matricular',
        'Verifique se o aluno já está matriculado neste curso ou se o cupão é válido.'
      );
    }
  };

  return (
    <View className="flex-1 bg-surface">
      {/* Barra de Pesquisa por E-mail (/auth/pesquisar) */}
      <View className="bg-white p-4 border-b border-gray-100">
        <Text className="text-xs font-poppins-bold text-gray-700 uppercase mb-1.5">
          Pesquisar Utilizador por E-mail
        </Text>
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3.5 py-2.5">
          <Search size={18} color="#6b7280" />
          <TextInput
            placeholder="Digite parte do e-mail do utilizador..."
            value={emailBusca}
            onChangeText={setEmailBusca}
            autoCapitalize="none"
            keyboardType="email-address"
            className="flex-1 ml-2.5 font-poppins text-sm text-gray-900"
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#b30016" />
        </View>
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }: { item: any }) => (
            <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="font-poppins-bold text-sm text-gray-900">
                  {item.email}
                </Text>
                <View className="flex-row items-center mt-1">
                  {item.isEnable ? (
                    <>
                      <CheckCircle size={13} color="#15803d" />
                      <Text className="text-xs font-poppins text-green-700 ml-1">
                        Conta Verificada
                      </Text>
                    </>
                  ) : (
                    <>
                      <XCircle size={13} color="#dc2626" />
                      <Text className="text-xs font-poppins text-red-600 ml-1">
                        Pendente de Verificação
                      </Text>
                    </>
                  )}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setAlunoSelecionado(item)}
                className="bg-brand px-3.5 py-2.5 rounded-xl flex-row items-center"
              >
                <UserPlus size={16} color="#ffffff" />
                <Text className="text-white font-poppins-bold text-xs ml-1.5">
                  Matricular
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Modal para Efetuar Matrícula */}
      <Modal visible={!!alunoSelecionado} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-poppins-bold text-gray-900">
                Nova Matrícula
              </Text>
              <TouchableOpacity onPress={() => setAlunoSelecionado(null)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs font-poppins text-gray-500 mb-4">
              Aluno: <Text className="font-poppins-bold text-gray-800">{alunoSelecionado?.email}</Text>
            </Text>

            <Text className="text-xs font-poppins-semibold text-gray-700 uppercase mb-2">
              Selecione o Curso Ativo:
            </Text>
            <FlatList
              data={cursosAtivos}
              keyExtractor={(c: any) => String(c.id)}
              style={{ maxHeight: 220, marginBottom: 16 }}
              renderItem={({ item: curso }: { item: any }) => {
                const selecionado = cursoSelecionadoId === String(curso.id);
                return (
                  <TouchableOpacity
                    onPress={() => setCursoSelecionadoId(String(curso.id))}
                    className={`p-3 rounded-xl border mb-2 ${
                      selecionado
                        ? 'bg-red-50 border-brand'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text className="font-poppins-bold text-sm text-gray-900">
                      {curso.titulo}
                    </Text>
                    <Text className="font-poppins text-xs text-brand">
                      {formatCurrency(curso.precoPromocional ?? curso.preco)}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            <Text className="text-xs font-poppins-semibold text-gray-700 uppercase mb-1">
              Cupão de Desconto (Opcional)
            </Text>
            <TextInput
              placeholder="Ex: WNS2026"
              value={codigoCupom}
              onChangeText={setCodigoCupom}
              autoCapitalize="characters"
              className="border border-gray-200 rounded-xl px-3.5 py-2.5 font-poppins mb-5"
            />

            <TouchableOpacity
              onPress={handleConfirmarMatricula}
              disabled={matricularMutation.isPending}
              className="bg-brand py-4 rounded-xl items-center"
            >
              {matricularMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-poppins-bold">
                  CONFIRMAR MATRÍCULA
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}