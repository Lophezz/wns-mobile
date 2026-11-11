import React, { useState } from 'react';
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
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Eye, EyeOff, X, Edit2 } from 'lucide-react-native';
import {
  useListarTodosOsCursos,
  useCriarCurso,
  useAtualizarCurso,
  getListarTodosOsCursosQueryKey,
  getListarCursosQueryKey,
} from '../../api/generated/endpoints/curso-controller/curso-controller';
import { formatCurrency } from '../../utils/formatters';
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

export default function AdminCursosScreen() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [cursoEditandoId, setCursoEditandoId] = useState<string | null>(null);

  const { data: cursosData, isLoading, isRefetching, refetch } = useListarTodosOsCursos();
  const criarCursoMutation = useCriarCurso();
  const atualizarCursoMutation = useAtualizarCurso();

  const cursos = Array.isArray(cursosData) ? cursosData : [];

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
      ativo: Boolean(curso.isActive ?? curso.active),
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
      reset();
      setCursoEditandoId(null);
      setModalVisivel(false);
    } catch {
      showToast({
        type: 'error',
        title: 'Erro ao salvar curso',
        message: 'Verifique os campos preenchidos e tente novamente.',
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

  const salvando = criarCursoMutation.isPending || atualizarCursoMutation.isPending;

  return (
    <View className="flex-1 bg-surface">
      <View className="p-4 bg-white border-b border-gray-100 flex-row justify-between items-center">
        <View className="flex-1 mr-3">
          <Text className="font-poppins-bold text-gray-900 text-sm">
            Catálogo Completo (/cursos/all)
          </Text>
          <Text className="font-poppins text-gray-500 text-xs">
            Toque em Editar para alterar dados ou no interruptor para ativar/ocultar.
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
        </View>
      ) : (
        <FlatList
          data={cursos}
          keyExtractor={(item: any, idx) => String(item?.id ?? idx)}
          contentContainerStyle={{ padding: 16 }}
          refreshing={isRefetching}
          onRefresh={() => {
            refetch();
          }}
          renderItem={({ item }: { item: any }) => {
            const ativo = Boolean(item.isActive ?? item.active);

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
                <Text className="text-sm font-poppins-bold text-brand">
                  {formatCurrency(item.preco)}
                </Text>
              </View>
            );
          }}
        />
      )}

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
    </View>
  );
}