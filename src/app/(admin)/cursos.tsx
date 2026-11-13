import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Eye,
  EyeOff,
  X,
  Edit2,
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from 'lucide-react-native';
import {
  useListarTodosOsCursos,
  useListarCursos,
  useCriarCurso,
  useAtualizarCurso,
  getListarTodosOsCursosQueryKey,
  getListarCursosQueryKey,
} from '../../api/generated/endpoints/curso-controller/curso-controller';
import {
  useListarMateriais,
  useDeletarMaterial,
  getListarMateriaisQueryKey,
} from '../../api/generated/endpoints/material-curso-controller/material-curso-controller';
import { AXIOS_INSTANCE } from '../../api/axios-instance';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToastStore } from '../../store/toast-store';

const cursoSchema = z.object({
  titulo: z.string().min(3, 'Informe o título do curso'),
  descricao: z.string().min(10, 'Informe uma descrição detalhada'),
  preco: z.string().min(1, 'Informe o preço (ex: 150.00)'),
  cargaHoraria: z.string().min(1, 'Informe a carga horária em horas'),
  tipoCurso: z.enum(['PRESENCIAL', 'EAD']),
  ativo: z.boolean(),
});

type CursoFormData = z.infer<typeof cursoSchema>;

// Extrai o array mesmo que o back-end mude entre Array direto, Page (.content) ou .data
function extrairArrayCursos(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.content)) return raw.content;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.content)) return raw.data.content;
  return [];
}

export default function AdminCursosScreen() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);

  const [modalVisivel, setModalVisivel] = useState(false);
  const [cursoEditandoId, setCursoEditandoId] = useState<string | null>(null);

  // Estados do Modal de Materiais (PDF)
  const [cursoMaterialSelecionado, setCursoMaterialSelecionado] = useState<any | null>(null);
  const [tituloMaterial, setTituloMaterial] = useState('');
  const [arquivoSelecionado, setArquivoSelecionado] = useState<{
    uri: string;
    name: string;
    mimeType?: string;
    size?: number;
  } | null>(null);
  const [enviandoPdf, setEnviandoPdf] = useState(false);

  const {
    data: cursosAllData,
    isLoading,
    isError,
    error,
    isRefetching,
    refetch,
  } = useListarTodosOsCursos();

  // Fallback: busca também /cursos caso /cursos/all venha vazio ou paginado diferente
  const { data: cursosAtivosData, refetch: refetchAtivos } = useListarCursos();

  const criarCursoMutation = useCriarCurso();
  const atualizarCursoMutation = useAtualizarCurso();
  const deletarMaterialMutation = useDeletarMaterial();

  const cursoIdMat = cursoMaterialSelecionado?.id ? String(cursoMaterialSelecionado.id) : '';
  const { data: materiaisData, isLoading: loadingMateriais } = useListarMateriais(cursoIdMat, {
    query: { enabled: !!cursoIdMat },
  });

  const cursos = useMemo(() => {
    const listaAll = extrairArrayCursos(cursosAllData);
    if (listaAll.length > 0) return listaAll;
    return extrairArrayCursos(cursosAtivosData);
  }, [cursosAllData, cursosAtivosData]);

  const materiais = useMemo(() => extrairArrayCursos(materiaisData), [materiaisData]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CursoFormData>({
    resolver: zodResolver(cursoSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      preco: '',
      cargaHoraria: '',
      tipoCurso: 'PRESENCIAL',
      ativo: true,
    },
  });

  const abrirModalNovo = () => {
    setCursoEditandoId(null);
    reset({
      titulo: '',
      descricao: '',
      preco: '',
      cargaHoraria: '',
      tipoCurso: 'PRESENCIAL',
      ativo: true,
    });
    setModalVisivel(true);
  };

  const abrirModalEdicao = (curso: any) => {
    setCursoEditandoId(String(curso.id));
    reset({
      titulo: curso.titulo || '',
      descricao: curso.descricao || '',
      preco: String(curso.preco ?? ''),
      cargaHoraria: String(curso.cargaHoraria ?? ''),
      tipoCurso: curso.tipoCurso === 'EAD' ? 'EAD' : 'PRESENCIAL',
      ativo: Boolean(curso.isActive ?? curso.active ?? curso.ativo),
    });
    setModalVisivel(true);
  };

  const onSubmitCurso = async (data: CursoFormData) => {
    const precoNumerico = parseFloat(data.preco.replace(',', '.'));
    const cargaNumerica = parseInt(data.cargaHoraria, 10);

    if (isNaN(precoNumerico) || precoNumerico <= 0 || isNaN(cargaNumerica) || cargaNumerica <= 0) {
      showToast({
        type: 'warning',
        title: 'Dados inválidos',
        message: 'Verifique se o preço e a carga horária são números maiores que zero.',
      });
      return;
    }

    try {
      if (cursoEditandoId) {
        await atualizarCursoMutation.mutateAsync({
          id: cursoEditandoId,
          data: {
            titulo: data.titulo.trim(),
            descricao: data.descricao.trim(),
            preco: precoNumerico,
            cargaHoraria: cargaNumerica,
            tipoCurso: data.tipoCurso as any,
            isActive: data.ativo,
          },
        });
        showToast({
          type: 'success',
          title: 'Curso atualizado!',
          message: 'As alterações do curso foram salvas com sucesso.',
        });
      } else {
        await criarCursoMutation.mutateAsync({
          data: {
            titulo: data.titulo.trim(),
            descricao: data.descricao.trim(),
            preco: precoNumerico,
            cargaHoraria: cargaNumerica,
            tipoCurso: data.tipoCurso as any,
            ativo: data.ativo,
          },
        });
        showToast({
          type: 'success',
          title: 'Curso criado com sucesso!',
          message: data.ativo
            ? 'O curso já está publicado no catálogo dos alunos.'
            : 'O curso foi salvo como oculto.',
        });
      }

      await queryClient.invalidateQueries({ queryKey: getListarTodosOsCursosQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getListarCursosQueryKey() });
      await refetch();
      await refetchAtivos();
      reset();
      setCursoEditandoId(null);
      setModalVisivel(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.erro ||
        'Verifique os campos preenchidos e tente novamente.';
      showToast({
        type: 'error',
        title: 'Erro ao salvar curso',
        message: msg,
      });
    }
  };

  const handleToggleAtivo = async (curso: any, novoStatus: boolean) => {
    try {
      await atualizarCursoMutation.mutateAsync({
        id: String(curso.id),
        data: {
          isActive: novoStatus,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListarTodosOsCursosQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getListarCursosQueryKey() });
      await refetch();
      await refetchAtivos();
      showToast({
        type: 'success',
        title: novoStatus ? 'Curso Ativado!' : 'Curso Ocultado',
        message: `O curso "${curso.titulo}" agora está ${novoStatus ? 'visível' : 'inativo'}.`,
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível alterar a visibilidade do curso.',
      });
    }
  };

  const handleEscolherPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      const maxBytes = 20 * 1024 * 1024;

      if (file.size && file.size > maxBytes) {
        showToast({
          type: 'warning',
          title: 'Arquivo muito grande',
          message: 'O limite máximo permitido pelo servidor é de 20 MB.',
        });
        return;
      }

      setArquivoSelecionado({
        uri: file.uri,
        name: file.name || 'material.pdf',
        mimeType: file.mimeType || 'application/pdf',
        size: file.size,
      });

      if (!tituloMaterial.trim()) {
        setTituloMaterial(file.name.replace(/\.pdf$/i, ''));
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Erro ao selecionar arquivo',
        message: 'Não foi possível abrir o seletor de documentos.',
      });
    }
  };

  const handleUploadPdf = async () => {
    if (!cursoIdMat || !tituloMaterial.trim() || !arquivoSelecionado) {
      showToast({
        type: 'warning',
        title: 'Campos obrigatórios',
        message: 'Informe o título da apostila/material e escolha um arquivo PDF.',
      });
      return;
    }

    try {
      setEnviandoPdf(true);
      const formData = new FormData();
      formData.append('titulo', tituloMaterial.trim());
      formData.append('arquivo', {
        uri: arquivoSelecionado.uri,
        name: arquivoSelecionado.name,
        type: arquivoSelecionado.mimeType || 'application/pdf',
      } as any);

      await AXIOS_INSTANCE.post(`/mat/${cursoIdMat}/materiais`, formData, {
        params: { titulo: tituloMaterial.trim() },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await queryClient.invalidateQueries({ queryKey: getListarMateriaisQueryKey(cursoIdMat) });
      setTituloMaterial('');
      setArquivoSelecionado(null);
      showToast({
        type: 'success',
        title: 'PDF publicado!',
        message: 'O material já está disponível para os alunos matriculados neste curso.',
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Não foi possível enviar o PDF (verifique se tem até 20MB).';
      showToast({
        type: 'error',
        title: 'Erro no upload',
        message: msg,
      });
    } finally {
      setEnviandoPdf(false);
    }
  };

  const handleDeletarPdf = async (materialId: string) => {
    try {
      await deletarMaterialMutation.mutateAsync({ materialId });
      await queryClient.invalidateQueries({ queryKey: getListarMateriaisQueryKey(cursoIdMat) });
      showToast({
        type: 'success',
        title: 'Material excluído!',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Erro ao excluir material',
      });
    }
  };

  const salvando = criarCursoMutation.isPending || atualizarCursoMutation.isPending;

  return (
    <View className="flex-1 bg-surface">
      <View className="p-4 bg-white border-b border-gray-100 flex-row justify-between items-center">
        <View className="flex-1 mr-3">
          <Text className="font-poppins-bold text-gray-900 text-sm">
            Catálogo Completo (/cursos/all)
          </Text>
          <Text className="font-poppins text-gray-500 text-xs">
            Gerencie cursos, visibilidade e materiais em PDF.
          </Text>
        </View>
        <TouchableOpacity
          onPress={abrirModalNovo}
          className="bg-brand px-4 py-2.5 rounded-xl flex-row items-center"
        >
          <Plus size={18} color="#ffffff" />
          <Text className="text-white font-poppins-bold text-xs ml-1.5">Novo Curso</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#b30016" />
          <Text className="font-poppins text-xs text-gray-500 mt-2">
            Carregando catálogo de cursos...
          </Text>
        </View>
      ) : isError && cursos.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <AlertCircle size={44} color="#dc2626" />
          <Text className="font-poppins-bold text-base text-gray-900 mt-3 text-center">
            Erro ao carregar cursos (/cursos/all)
          </Text>
          <Text className="font-poppins text-xs text-gray-500 text-center mt-1 mb-4">
            Status HTTP: {(error as any)?.response?.status || 'Sem resposta'} •{' '}
            {(error as any)?.response?.data?.message ||
              (error as any)?.message ||
              'Faça logout e login novamente caso sua sessão de Admin tenha expirado.'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              refetch();
              refetchAtivos();
            }}
            className="bg-brand px-5 py-3 rounded-xl flex-row items-center"
          >
            <RefreshCw size={16} color="#ffffff" />
            <Text className="text-white font-poppins-bold text-xs ml-2">
              Tentar Novamente
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cursos}
          keyExtractor={(item: any, idx) => String(item?.id ?? idx)}
          contentContainerStyle={{ padding: 16 }}
          refreshing={isRefetching}
          onRefresh={() => {
            refetch();
            refetchAtivos();
          }}
          ListEmptyComponent={
            <View className="bg-white rounded-2xl p-8 items-center border border-gray-100 mt-4">
              <Text className="font-poppins-bold text-base text-gray-800">
                Nenhum curso retornado pela API
              </Text>
              <Text className="font-poppins text-xs text-gray-500 text-center mt-1 mb-4">
                Toque no botão abaixo para sincronizar com o servidor.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  refetch();
                  refetchAtivos();
                }}
                className="bg-brand px-5 py-2.5 rounded-xl"
              >
                <Text className="text-white font-poppins-bold text-xs">
                  Recarregar Cursos
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }: { item: any }) => {
            const ativo = Boolean(item.isActive ?? item.active ?? item.ativo);

            return (
              <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-center mb-2">
                  <View
                    className={`flex-row items-center px-2.5 py-1 rounded-full ${
                      ativo ? 'bg-green-100' : 'bg-gray-200'
                    }`}
                  >
                    {ativo ? (
                      <Eye size={13} color="#15803d" />
                    ) : (
                      <EyeOff size={13} color="#4b5563" />
                    )}
                    <Text
                      className={`text-xs font-poppins-bold ml-1.5 ${
                        ativo ? 'text-green-800' : 'text-gray-700'
                      }`}
                    >
                      {ativo ? 'VISÍVEL' : 'OCULTO'}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => abrirModalEdicao(item)}
                      className="flex-row items-center px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <Edit2 size={14} color="#2563eb" />
                      <Text className="text-xs font-poppins-bold text-blue-700 ml-1">
                        Editar
                      </Text>
                    </TouchableOpacity>

                    <Switch
                      value={ativo}
                      onValueChange={(val) => handleToggleAtivo(item, val)}
                      trackColor={{ false: '#d1d5db', true: '#b30016' }}
                      thumbColor="#ffffff"
                    />
                  </View>
                </View>

                <Text className="text-base font-poppins-bold text-gray-900">
                  {item.titulo}
                </Text>
                <Text className="text-xs font-poppins text-gray-500 mb-2">
                  Modalidade: {item.tipoCurso || 'PRESENCIAL'} • {item.cargaHoraria}h
                </Text>

                <View className="flex-row justify-between items-center pt-2.5 mt-1 border-t border-gray-100">
                  <Text className="text-sm font-poppins-bold text-brand">
                    {formatCurrency(item.preco)}
                  </Text>

                  <TouchableOpacity
                    onPress={() => {
                      setCursoMaterialSelecionado(item);
                      setTituloMaterial('');
                      setArquivoSelecionado(null);
                    }}
                    className="flex-row items-center bg-red-50 px-3 py-2 rounded-xl border border-red-200"
                  >
                    <FileText size={15} color="#b30016" />
                    <Text className="text-xs font-poppins-bold text-brand ml-1.5">
                      Materiais (PDF)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Modal de Criar/Editar Curso */}
      <Modal visible={modalVisivel} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-poppins-bold text-gray-900">
                {cursoEditandoId ? '✏️ Editar Curso' : 'Cadastrar Novo Curso'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisivel(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text className="text-xs font-poppins-semibold text-gray-700 mb-1">
                Título do Curso
              </Text>
              <Controller
                control={control}
                name="titulo"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Ex: Inglês Intensivo - Intermediário"
                    value={value}
                    onChangeText={onChange}
                    className="border border-gray-200 rounded-xl px-3.5 py-2.5 font-poppins text-gray-900 mb-1"
                  />
                )}
              />
              {errors.titulo && (
                <Text className="text-red-600 text-xs mb-2">{errors.titulo.message}</Text>
              )}

              <Text className="text-xs font-poppins-semibold text-gray-700 mb-1.5 mt-2">
                Modalidade (tipoCurso)
              </Text>
              <Controller
                control={control}
                name="tipoCurso"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row gap-3 mb-2">
                    {(['PRESENCIAL', 'EAD'] as const).map((mod) => {
                      const selecionado = value === mod;
                      return (
                        <TouchableOpacity
                          key={mod}
                          onPress={() => onChange(mod)}
                          className={`flex-1 py-3 rounded-xl items-center border ${
                            selecionado
                              ? 'bg-brand border-brand'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <Text
                            className={`font-poppins-bold text-xs ${
                              selecionado ? 'text-white' : 'text-gray-700'
                            }`}
                          >
                            {mod}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              />

              <View className="flex-row gap-3 mt-2">
                <View className="flex-1">
                  <Text className="text-xs font-poppins-semibold text-gray-700 mb-1">
                    Preço (R$)
                  </Text>
                  <Controller
                    control={control}
                    name="preco"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        placeholder="150.00"
                        keyboardType="decimal-pad"
                        value={value}
                        onChangeText={onChange}
                        className="border border-gray-200 rounded-xl px-3.5 py-2.5 font-poppins text-gray-900"
                      />
                    )}
                  />
                  {errors.preco && (
                    <Text className="text-red-600 text-xs mt-1">{errors.preco.message}</Text>
                  )}
                </View>

                <View className="flex-1">
                  <Text className="text-xs font-poppins-semibold text-gray-700 mb-1">
                    Carga Horária (h)
                  </Text>
                  <Controller
                    control={control}
                    name="cargaHoraria"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        placeholder="120"
                        keyboardType="number-pad"
                        value={value}
                        onChangeText={onChange}
                        className="border border-gray-200 rounded-xl px-3.5 py-2.5 font-poppins text-gray-900"
                      />
                    )}
                  />
                  {errors.cargaHoraria && (
                    <Text className="text-red-600 text-xs mt-1">{errors.cargaHoraria.message}</Text>
                  )}
                </View>
              </View>

              <Text className="text-xs font-poppins-semibold text-gray-700 mb-1 mt-3">
                Descrição
              </Text>
              <Controller
                control={control}
                name="descricao"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder="Detalhes do conteúdo programático, faixa etária e material..."
                    multiline
                    numberOfLines={3}
                    value={value}
                    onChangeText={onChange}
                    className="border border-gray-200 rounded-xl px-3.5 py-2.5 font-poppins text-gray-900 mb-1"
                  />
                )}
              />
              {errors.descricao && (
                <Text className="text-red-600 text-xs mb-2">{errors.descricao.message}</Text>
              )}

              <Controller
                control={control}
                name="ativo"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row items-center justify-between bg-gray-50 p-3.5 rounded-xl border border-gray-200 mt-3 mb-2">
                    <View className="flex-1 mr-3">
                      <Text className="font-poppins-bold text-xs text-gray-900">
                        Curso visível no catálogo?
                      </Text>
                      <Text className="font-poppins text-[11px] text-gray-500">
                        Se ativado, os alunos poderão ver e solicitar matrícula.
                      </Text>
                    </View>
                    <Switch
                      value={value}
                      onValueChange={onChange}
                      trackColor={{ false: '#d1d5db', true: '#b30016' }}
                      thumbColor="#ffffff"
                    />
                  </View>
                )}
              />

              <TouchableOpacity
                onPress={() => handleSubmit(onSubmitCurso)()}
                disabled={salvando}
                className="bg-brand py-4 rounded-xl items-center mt-3 mb-4"
              >
                {salvando ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-poppins-bold">
                    {cursoEditandoId ? 'SALVAR ALTERAÇÕES' : 'SALVAR CURSO'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Upload e Gestão de Materiais (PDFs) do Curso */}
      <Modal visible={!!cursoMaterialSelecionado} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-poppins-bold text-gray-900">
                📄 Materiais em PDF
              </Text>
              <TouchableOpacity onPress={() => setCursoMaterialSelecionado(null)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs font-poppins text-gray-500 mb-4">
              Curso:{' '}
              <Text className="font-poppins-bold text-gray-800">
                {cursoMaterialSelecionado?.titulo}
              </Text>
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-5">
                <Text className="font-poppins-bold text-xs text-gray-800 uppercase mb-2">
                  Publicar Novo PDF (Máx. 20 MB)
                </Text>

                <TextInput
                  placeholder="Título do material (ex: Apostila Módulo 1)"
                  value={tituloMaterial}
                  onChangeText={setTituloMaterial}
                  className="bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 font-poppins text-sm text-gray-900 mb-3"
                />

                <TouchableOpacity
                  onPress={handleEscolherPdf}
                  className="flex-row items-center justify-center bg-white border border-dashed border-gray-300 py-3 px-4 rounded-xl mb-3"
                >
                  <FileText size={18} color="#b30016" />
                  <Text
                    numberOfLines={1}
                    className="font-poppins-semibold text-xs text-gray-700 ml-2"
                  >
                    {arquivoSelecionado
                      ? `Selecionado: ${arquivoSelecionado.name}`
                      : 'Escolher arquivo .PDF no aparelho'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleUploadPdf}
                  disabled={enviandoPdf}
                  className="bg-brand py-3.5 rounded-xl flex-row items-center justify-center"
                >
                  {enviandoPdf ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Upload size={16} color="#ffffff" />
                      <Text className="text-white font-poppins-bold text-xs ml-2">
                        ENVIAR PDF PARA O CURSO
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <Text className="font-poppins-bold text-sm text-gray-900 mb-2">
                Materiais já publicados ({materiais.length})
              </Text>

              {loadingMateriais ? (
                <ActivityIndicator color="#b30016" className="my-4" />
              ) : materiais.length === 0 ? (
                <Text className="font-poppins text-xs text-gray-500 text-center py-4">
                  Nenhum PDF publicado para este curso ainda.
                </Text>
              ) : (
                materiais.map((mat: any, idx: number) => (
                  <View
                    key={String(mat?.id ?? idx)}
                    className="flex-row items-center justify-between bg-gray-50 p-3.5 rounded-xl mb-2.5 border border-gray-100"
                  >
                    <View className="flex-1 mr-3">
                      <Text className="font-poppins-bold text-xs text-gray-900">
                        {mat.titulo || 'Material em PDF'}
                      </Text>
                      {mat.createdAt && (
                        <Text className="font-poppins text-[11px] text-gray-500 mt-0.5">
                          Postado em: {formatDate(mat.createdAt)}
                        </Text>
                      )}
                    </View>

                    <View className="flex-row items-center gap-2">
                      {mat.downloadUrl && (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(mat.downloadUrl)}
                          className="p-2 bg-blue-50 rounded-lg"
                        >
                          <ExternalLink size={16} color="#2563eb" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => handleDeletarPdf(String(mat.id))}
                        className="p-2 bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}