import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import {
  Award,
  CheckCircle,
  Clock,
  FileText,
  Download,
  X,
  BookOpen,
} from 'lucide-react-native';
import { useListarMinhasMatriculas } from '../../api/generated/endpoints/matricula-controller/matricula-controller';
import { useListarCursos } from '../../api/generated/endpoints/curso-controller/curso-controller';
import { useListarMateriais } from '../../api/generated/endpoints/material-curso-controller/material-curso-controller';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToastStore } from '../../store/toast-store';

export default function MinhasMatriculasScreen() {
  const showToast = useToastStore((s) => s.showToast);
  const { data, isLoading, isError, refetch, isRefetching } = useListarMinhasMatriculas();
  const { data: catalogoData } = useListarCursos();

  const [cursoMateriaisModal, setCursoMateriaisModal] = useState<{
    cursoId: string;
    titulo: string;
  } | null>(null);

  const matriculas = Array.isArray(data) ? data : [];
  const catalogo = Array.isArray(catalogoData) ? catalogoData : [];

  const { data: materiaisData, isLoading: loadingMateriais } = useListarMateriais(
    cursoMateriaisModal?.cursoId || '',
    {
      query: { enabled: !!cursoMateriaisModal?.cursoId },
    }
  );

  const materiais = Array.isArray(materiaisData) ? materiaisData : [];

  // Descobre o cursoId real da matrícula (mesmo se o DTO trouxer apenas o nomeCurso)
  const obterCursoIdDaMatricula = (item: any): string => {
    const idDireto = item.cursoId ?? item.idCurso ?? item.curso?.id;
    if (idDireto) return String(idDireto);

    const nomeMat = String(
      item.nomeCurso || item.tituloCurso || item.cursoTitulo || item.titulo || ''
    )
      .toLowerCase()
      .trim();

    const encontrado = catalogo.find(
      (c: any) => String(c.titulo || '').toLowerCase().trim() === nomeMat
    );
    return encontrado?.id ? String(encontrado.id) : '';
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
        <TouchableOpacity onPress={() => refetch()} className="bg-brand px-5 py-3 rounded-xl">
          <Text className="text-white font-poppins-bold">Atualizar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={matriculas}
        keyExtractor={(item: any, idx) => String(item.id || item.matriculaId || idx)}
        contentContainerStyle={{ padding: 16 }}
        refreshing={isRefetching}
        onRefresh={() => {
          refetch();
        }}
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
          const cursoId = obterCursoIdDaMatricula(item);

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
                <Text className="text-xs font-poppins text-gray-500 pt-2 pb-3 border-t border-gray-100">
                  Valor registrado na matrícula: {formatCurrency(item.valorPago)}
                </Text>
              )}

              {/* Botão de Materiais Didáticos (PDF) exclusivos de alunos matriculados */}
              <TouchableOpacity
                onPress={() => {
                  if (!cursoId) {
                    showToast({
                      type: 'warning',
                      title: 'Curso não identificado',
                      message: 'Atualize o catálogo de cursos e tente novamente.',
                    });
                    return;
                  }
                  setCursoMateriaisModal({ cursoId, titulo: nomeDoCurso });
                }}
                className="bg-brand py-3 px-4 rounded-xl flex-row items-center justify-center mt-1"
              >
                <FileText size={16} color="#ffffff" />
                <Text className="text-white font-poppins-bold text-xs ml-2">
                  ACESSAR MATERIAIS E APOSTILAS (PDF)
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Modal de Apostilas e PDFs do Aluno */}
      <Modal visible={!!cursoMateriaisModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center">
                <BookOpen size={20} color="#b30016" />
                <Text className="text-lg font-poppins-bold text-gray-900 ml-2">
                  Materiais do Curso
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCursoMateriaisModal(null)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs font-poppins text-gray-500 mb-4">
              {cursoMateriaisModal?.titulo}
            </Text>

            {loadingMateriais ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="large" color="#b30016" />
                <Text className="text-xs font-poppins text-gray-500 mt-2">
                  Buscando materiais em PDF...
                </Text>
              </View>
            ) : materiais.length === 0 ? (
              <View className="bg-gray-50 p-6 rounded-2xl items-center border border-gray-100 my-4">
                <FileText size={36} color="#9ca3af" />
                <Text className="font-poppins-bold text-sm text-gray-800 mt-2">
                  Nenhum PDF disponível ainda
                </Text>
                <Text className="font-poppins text-xs text-gray-500 text-center mt-1">
                  O professor ou administrador ainda não publicou apostilas para este curso.
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {materiais.map((mat: any, index: number) => (
                  <TouchableOpacity
                    key={String(mat?.id ?? index)}
                    onPress={() => {
                      if (mat.downloadUrl) {
                        Linking.openURL(mat.downloadUrl);
                      } else {
                        showToast({
                          type: 'error',
                          title: 'Link indisponível',
                          message: 'Este arquivo não possui uma URL de download válida.',
                        });
                      }
                    }}
                    className="flex-row items-center justify-between bg-gray-50 p-4 rounded-2xl mb-3 border border-gray-200"
                  >
                    <View className="flex-row items-center flex-1 mr-3">
                      <View className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center mr-3">
                        <FileText size={20} color="#b30016" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-poppins-bold text-sm text-gray-900">
                          {mat.titulo || `Apostila #${index + 1}`}
                        </Text>
                        {mat.createdAt && (
                          <Text className="font-poppins text-xs text-gray-500">
                            Publicado em {formatDate(mat.createdAt)}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View className="bg-brand px-3 py-2 rounded-xl flex-row items-center">
                      <Download size={14} color="#ffffff" />
                      <Text className="text-white font-poppins-bold text-xs ml-1">
                        ABRIR PDF
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}