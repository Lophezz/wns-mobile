import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { UserCheck, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import {
  usePainelAdministrativo,
  useAtualizarMatriculaAdmin,
  getPainelAdministrativoQueryKey,
} from '../../api/generated/endpoints/matricula-controller/matricula-controller';

export default function AdminDashboardScreen() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, refetch } = usePainelAdministrativo({
    pageable: { page, size: 10 },
  } as any);

  const atualizarMatriculaMutation = useAtualizarMatriculaAdmin();

  const paginaDados: any = data;
  const alunos = Array.isArray(paginaDados?.content) ? paginaDados.content : [];
  const totalPages = Number(paginaDados?.totalPages || 1);

  const handleAlterarProgresso = async (matriculaId: string, novoProgresso: number) => {
    try {
      await atualizarMatriculaMutation.mutateAsync({
        id: matriculaId,
        data: {
          progresso: novoProgresso,
          status: novoProgresso >= 100 ? ('CONCLUIDA' as any) : ('ATIVA' as any),
        },
      });
      await queryClient.invalidateQueries({ queryKey: getPainelAdministrativoQueryKey() });
      Alert.alert('Sucesso', `Progresso atualizado para ${novoProgresso}%!`);
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o progresso da matrícula.');
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#b30016" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-surface items-center justify-center p-6">
        <Text className="text-gray-700 font-poppins-semibold mb-4 text-center">
          Erro ao carregar o painel administrativo.
        </Text>
        <TouchableOpacity onPress={() => refetch()} className="bg-brand px-5 py-3 rounded-xl">
          <Text className="text-white font-poppins-bold">Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={alunos}
        keyExtractor={(item: any) => String(item.alunoId || item.id || item.email)}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View className="bg-gray-900 rounded-2xl p-4 mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-white font-poppins-bold text-base">
                Relatório de Alunos e Cursos
              </Text>
              <Text className="text-gray-400 font-poppins text-xs">
                Página {page + 1} de {Math.max(1, totalPages)}
              </Text>
            </View>
            <UserCheck color="#ffb400" size={28} />
          </View>
        }
        renderItem={({ item }: { item: any }) => {
          const cursosDoAluno = Array.isArray(item.cursos) ? item.cursos : [];

          return (
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
              <Text className="text-base font-poppins-bold text-gray-900">
                {item.nome}
              </Text>
              <Text className="text-xs font-poppins text-gray-500 mb-3">
                {item.email}
              </Text>

              {cursosDoAluno.length === 0 ? (
                <View className="bg-gray-50 p-3 rounded-xl">
                  <Text className="text-xs font-poppins text-gray-400">
                    Sem matrículas registadas.
                  </Text>
                </View>
              ) : (
                cursosDoAluno.map((mat: any) => (
                  <View
                    key={String(mat.matriculaId)}
                    className="bg-gray-50 p-3 rounded-xl mb-2 border border-gray-200"
                  >
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="font-poppins-bold text-xs text-gray-800 flex-1 mr-2">
                        {mat.tituloCurso}
                      </Text>
                      <Text className="text-xs font-poppins-bold text-brand">
                        {Number(mat.progresso || 0).toFixed(0)}% • {mat.status}
                      </Text>
                    </View>

                    {/* Botões rápidos para atualizar progresso via PATCH */}
                    <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-200">
                      <Text className="text-[11px] font-poppins text-gray-500">
                        Definir progresso:
                      </Text>
                      <View className="flex-row gap-1.5">
                        {[25, 50, 75, 100].map((pct) => (
                          <TouchableOpacity
                            key={pct}
                            onPress={() => handleAlterarProgresso(String(mat.matriculaId), pct)}
                            className={`px-2.5 py-1 rounded-lg ${
                              Number(mat.progresso) === pct ? 'bg-brand' : 'bg-gray-200'
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-poppins-bold ${
                                Number(mat.progresso) === pct ? 'text-white' : 'text-gray-800'
                              }`}
                            >
                              {pct}%
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          );
        }}
        ListFooterComponent={
          <View className="flex-row justify-between items-center mt-2 mb-6">
            <TouchableOpacity
              disabled={page <= 0}
              onPress={() => setPage((p) => Math.max(0, p - 1))}
              className={`flex-row items-center px-4 py-2.5 rounded-xl bg-white border border-gray-200 ${
                page <= 0 ? 'opacity-40' : ''
              }`}
            >
              <ChevronLeft size={16} color="#111827" />
              <Text className="font-poppins-semibold text-xs ml-1">Anterior</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={page + 1 >= totalPages}
              onPress={() => setPage((p) => p + 1)}
              className={`flex-row items-center px-4 py-2.5 rounded-xl bg-white border border-gray-200 ${
                page + 1 >= totalPages ? 'opacity-40' : ''
              }`}
            >
              <Text className="font-poppins-semibold text-xs mr-1">Seguinte</Text>
              <ChevronRight size={16} color="#111827" />
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}