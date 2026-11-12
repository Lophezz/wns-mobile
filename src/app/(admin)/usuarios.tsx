import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  Search,
  UserPlus,
  CheckCircle,
  XCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { usePesquisarUsuarios } from '../../api/generated/endpoints/auth-controller/auth-controller';
import { useListarCursos } from '../../api/generated/endpoints/curso-controller/curso-controller';
import {
  useMatricularAluno,
  getPainelAdministrativoQueryKey,
} from '../../api/generated/endpoints/matricula-controller/matricula-controller';
import { formatCurrency } from '../../utils/formatters';
import { useToastStore } from '../../store/toast-store';

export default function AdminUsuariosScreen() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);

  const [emailBusca, setEmailBusca] = useState('');
  const [page, setPage] = useState(0);
  const [alunoSelecionado, setAlunoSelecionado] = useState<any | null>(null);
  const [cursoSelecionadoId, setCursoSelecionadoId] = useState<string>('');
  const [codigoCupom, setCodigoCupom] = useState('');

  const { data: pesquisaData, isLoading, isRefetching, refetch } = usePesquisarUsuarios({
    email: emailBusca.trim() || undefined,
    page,
    size: 15,
  } as any);

  const { data: cursosAtivosData } = useListarCursos();
  const matricularMutation = useMatricularAluno();

  const paginaUsuarios: any = pesquisaData;
  const usuarios = Array.isArray(paginaUsuarios?.content) ? paginaUsuarios.content : [];
  const totalPages = Number(paginaUsuarios?.totalPages || 1);
  const cursosAtivos = Array.isArray(cursosAtivosData) ? cursosAtivosData : [];

  const handleConfirmarMatricula = async () => {
    if (!cursoSelecionadoId) {
      showToast({
        type: 'warning',
        title: 'Selecione um curso',
        message: 'Toque em um curso ativo da lista antes de confirmar.',
      });
      return;
    }

    // Lê exatamente o campo 'idAluno' que o back-end retorna no /auth/pesquisar
    const idDoAluno =
      alunoSelecionado?.idAluno ??
      alunoSelecionado?.id ??
      alunoSelecionado?.alunoId;

    if (!idDoAluno) {
      showToast({
        type: 'error',
        title: 'Erro ao identificar aluno',
        message: 'Não foi possível localizar o idAluno deste usuário.',
      });
      return;
    }

    try {
      const payload: any = {
        alunoId: String(idDoAluno),
        cursoId: String(cursoSelecionadoId),
      };

      if (codigoCupom.trim().length > 0) {
        payload.codigoCupom = codigoCupom.trim().toUpperCase();
      }

      await matricularMutation.mutateAsync({ data: payload });
      await queryClient.invalidateQueries({ queryKey: getPainelAdministrativoQueryKey() });

      showToast({
        type: 'success',
        title: 'Matrícula Confirmada!',
        message: `Aluno ${alunoSelecionado.email} matriculado com sucesso!`,
      });
      setAlunoSelecionado(null);
      setCursoSelecionadoId('');
      setCodigoCupom('');
    } catch (err: any) {
      const msgBackend =
        err?.response?.data?.message ||
        err?.response?.data?.erro ||
        err?.response?.data?.error ||
        (typeof err?.response?.data === 'string' ? err.response.data : null);

      showToast({
        type: 'error',
        title: 'Não foi possível matricular',
        message:
          msgBackend ||
          'Verifique se o aluno já possui matrícula neste curso ou se o cupom é válido.',
      });
    }
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="bg-white p-4 border-b border-gray-100">
        <Text className="text-xs font-poppins-bold text-gray-700 uppercase mb-1.5">
          Pesquisar Usuário por E-mail
        </Text>
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3.5 py-2.5">
          <Search size={18} color="#6b7280" />
          <TextInput
            placeholder="Digite parte do e-mail do aluno..."
            value={emailBusca}
            onChangeText={(txt) => {
              setEmailBusca(txt);
              setPage(0);
            }}
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
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
              colors={['#b30016']}
            />
          }
        >
          {usuarios.map((item: any, idx: number) => {
            const verificado = Boolean(item.isEnable ?? item.enable ?? item.enabled);
            const nomeExibicao = item.nomeCompleto || item.nome;

            return (
              <View
                key={String(item?.idAluno ?? item?.id ?? item?.email ?? idx)}
                className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 flex-row items-center justify-between"
              >
                <View className="flex-1 mr-3">
                  {nomeExibicao && (
                    <Text className="font-poppins-bold text-sm text-gray-900">
                      {nomeExibicao}
                    </Text>
                  )}
                  <Text className="font-poppins-semibold text-xs text-gray-700">
                    {item.email}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    {verificado ? (
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
                  onPress={() => {
                    setAlunoSelecionado(item);
                    setCursoSelecionadoId('');
                    setCodigoCupom('');
                  }}
                  className="bg-brand px-3.5 py-2.5 rounded-xl flex-row items-center"
                >
                  <UserPlus size={16} color="#ffffff" />
                  <Text className="text-white font-poppins-bold text-xs ml-1.5">
                    Matricular
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          <View className="flex-row justify-between items-center mt-2 mb-6">
            <TouchableOpacity
              disabled={page <= 0}
              onPress={() => setPage((p) => Math.max(0, p - 1))}
              className={`flex-row items-center px-4 py-2.5 rounded-xl bg-white border border-gray-200 ${
                page <= 0 ? 'opacity-40' : ''
              }`}
            >
              <ChevronLeft size={16} color="#111827" />
              <Text className="font-poppins-semibold text-xs ml-1 text-gray-900">
                Anterior
              </Text>
            </TouchableOpacity>

            <Text className="text-xs font-poppins text-gray-500">
              Página {page + 1} de {Math.max(1, totalPages)}
            </Text>

            <TouchableOpacity
              disabled={page + 1 >= totalPages}
              onPress={() => setPage((p) => p + 1)}
              className={`flex-row items-center px-4 py-2.5 rounded-xl bg-white border border-gray-200 ${
                page + 1 >= totalPages ? 'opacity-40' : ''
              }`}
            >
              <Text className="font-poppins-semibold text-xs mr-1 text-gray-900">
                Seguinte
              </Text>
              <ChevronRight size={16} color="#111827" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

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
              Aluno:{' '}
              <Text className="font-poppins-bold text-gray-800">
                {alunoSelecionado?.email}
              </Text>
            </Text>

            <Text className="text-xs font-poppins-semibold text-gray-700 uppercase mb-2">
              Selecione o Curso Ativo ({cursosAtivos.length} disponíveis):
            </Text>

            <ScrollView style={{ maxHeight: 200, marginBottom: 16 }}>
              {cursosAtivos.map((curso: any, index: number) => {
                const idCurso = String(curso.id ?? index);
                const selecionado = cursoSelecionadoId === idCurso;
                return (
                  <TouchableOpacity
                    key={idCurso}
                    onPress={() => setCursoSelecionadoId(idCurso)}
                    className={`p-3.5 rounded-xl border mb-2 flex-row justify-between items-center ${
                      selecionado
                        ? 'bg-red-50 border-brand'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <View className="flex-1 mr-2">
                      <Text className="font-poppins-bold text-sm text-gray-900">
                        {curso.titulo}
                      </Text>
                      <Text className="font-poppins text-xs text-brand">
                        {formatCurrency(curso.precoPromocional ?? curso.preco)}
                      </Text>
                    </View>
                    {selecionado && <CheckCircle size={18} color="#b30016" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text className="text-xs font-poppins-semibold text-gray-700 uppercase mb-1">
              Cupom de Desconto (Opcional)
            </Text>
            <TextInput
              placeholder="Deixe em branco se não usar cupom"
              value={codigoCupom}
              onChangeText={setCodigoCupom}
              autoCapitalize="characters"
              className="border border-gray-200 rounded-xl px-3.5 py-2.5 font-poppins text-gray-900 mb-5"
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