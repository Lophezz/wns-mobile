import React from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Award, CheckCircle, Clock } from 'lucide-react-native';
import { useListarMinhasMatriculas } from '../../api/generated/endpoints/matricula-controller/matricula-controller';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToastStore } from '../../store/toast-store';

export default function MinhasMatriculasScreen() {
  const showToast = useToastStore((s) => s.showToast);
  const { data, isLoading, isError, refetch } = useListarMinhasMatriculas();
  const matriculas = Array.isArray(data) ? data : [];

  const handleRecarregar = async () => {
    try {
      await refetch();
      showToast({
        type: 'success',
        title: 'Atualizado',
        message: 'Lista de matrículas sincronizada.',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Erro ao atualizar',
        message: 'Verifique sua conexão e tente novamente.',
      });
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
          Não foi possível carregar suas matrículas no momento.
        </Text>
        <TouchableOpacity onPress={handleRecarregar} className="bg-brand px-5 py-3 rounded-xl">
          <Text className="text-white font-poppins-bold">Atualizar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={matriculas}
        keyExtractor={(item: any) => String(item.id || item.matriculaId)}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="bg-white rounded-2xl p-8 items-center border border-gray-100 mt-4">
            <Award size={44} color="#9ca3af" />
            <Text className="text-gray-800 font-poppins-bold text-base mt-3">
              Nenhuma matrícula ativa
            </Text>
            <Text className="text-gray-500 font-poppins text-sm text-center mt-1">
              Explore o catálogo de cursos para iniciar seus estudos na WNS School.
            </Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => {
          const progresso = Number(item.progresso || 0);
          const concluida = item.status === 'CONCLUIDA' || progresso >= 100;
          const nomeDoCurso =
            item.nomeCurso ||
            item.tituloCurso ||
            item.cursoTitulo ||
            item.titulo ||
            item.curso?.titulo ||
            'Curso WNS';

          return (
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
              <View className="flex-row justify-between items-center mb-2">
                <View
                  className={`px-3 py-1 rounded-full flex-row items-center ${
                    concluida ? 'bg-green-100' : 'bg-blue-50'
                  }`}
                >
                  {concluida ? (
                    <CheckCircle size={14} color="#15803d" />
                  ) : (
                    <Clock size={14} color="#1d4ed8" />
                  )}
                  <Text
                    className={`text-xs font-poppins-bold ml-1.5 ${
                      concluida ? 'text-green-800' : 'text-blue-800'
                    }`}
                  >
                    {item.status || 'EM ANDAMENTO'}
                  </Text>
                </View>

                {(item.createdAt || item.dataMatricula) && (
                  <Text className="text-xs font-poppins text-gray-400">
                    Início: {formatDate(item.createdAt || item.dataMatricula)}
                  </Text>
                )}
              </View>

              <Text className="text-lg font-poppins-bold text-gray-900 mb-3">
                {nomeDoCurso}
              </Text>

              {/* Barra de Progresso */}
              <View className="mb-3">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs font-poppins-semibold text-gray-600">
                    Progresso do Curso
                  </Text>
                  <Text className="text-xs font-poppins-bold text-brand">
                    {progresso.toFixed(0)}%
                  </Text>
                </View>
                <View className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    style={{ width: `${Math.min(100, progresso)}%` }}
                    className={`h-full ${concluida ? 'bg-green-600' : 'bg-brand'}`}
                  />
                </View>
              </View>

              {item.valorPago !== undefined && (
                <Text className="text-xs font-poppins text-gray-500 pt-2 border-t border-gray-100">
                  Valor registado na matrícula: {formatCurrency(item.valorPago)}
                </Text>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}