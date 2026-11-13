import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  Users,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  TrendingUp,
} from 'lucide-react-native';
import {
  usePainelAdministrativo,
  useAtualizarMatriculaAdmin,
  getPainelAdministrativoQueryKey,
} from '../../api/generated/endpoints/matricula-controller/matricula-controller';
import {
  useListarTodosOsCursos,
  useListarCursos,
} from '../../api/generated/endpoints/curso-controller/curso-controller';
import { formatCurrency } from '../../utils/formatters';
import { useToastStore } from '../../store/toast-store';

export default function AdminDashboardScreen() {
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);

  const { data, isLoading, isRefetching, refetch } = usePainelAdministrativo({
    page,
    size: 10,
  } as any);

  // Busca os cursos para obter os preços reais de cada matrícula
  const { data: todosCursosData } = useListarTodosOsCursos();
  const { data: cursosAtivosData } = useListarCursos();

  const atualizarStatusMutation = useAtualizarMatriculaAdmin();

  const pagina: any = data;
  const listaAlunos: any[] = Array.isArray(pagina?.content)
    ? pagina.content
    : Array.isArray(pagina)
    ? pagina
    : [];
  const totalPages = Number(pagina?.totalPages || 1);
  const totalElements = Number(pagina?.totalElements || listaAlunos.length);

  // Monta um dicionário de preços dos cursos (por ID e por Título)
  const mapaPrecosCursos = useMemo(() => {
    const listaAll = Array.isArray(todosCursosData)
      ? todosCursosData
      : Array.isArray((todosCursosData as any)?.content)
      ? (todosCursosData as any).content
      : [];
    const listaAtivos = Array.isArray(cursosAtivosData)
      ? cursosAtivosData
      : Array.isArray((cursosAtivosData as any)?.content)
      ? (cursosAtivosData as any).content
      : [];

    const cursosCombinados = [...listaAll, ...listaAtivos];
    const porId: Record<string, number> = {};
    const porTitulo: Record<string, number> = {};

    cursosCombinados.forEach((c: any) => {
      const valorCurso = Number(c.precoPromocional ?? c.novoValor ?? c.preco ?? 0);
      if (c.id && !porId[String(c.id)]) {
        porId[String(c.id)] = valorCurso;
      }
      if (c.titulo) {
        const chaveTitulo = String(c.titulo).toLowerCase().trim();
        if (!porTitulo[chaveTitulo] || valorCurso < porTitulo[chaveTitulo]) {
          porTitulo[chaveTitulo] = valorCurso;
        }
      }
    });

    return { porId, porTitulo };
  }, [todosCursosData, cursosAtivosData]);

  // Calcula KPIs Acadêmicos e Financeiros cruzando matrículas + catálogo de cursos
  const kpis = useMemo(() => {
    let ativas = 0;
    let concluidas = 0;
    let receitaTotal = 0;
    let alunosComMatricula = 0;

    listaAlunos.forEach((aluno: any) => {
      const mats = Array.isArray(aluno.matriculas)
        ? aluno.matriculas
        : Array.isArray(aluno.cursos)
        ? aluno.cursos
        : [];

      if (mats.length > 0) {
        alunosComMatricula += 1;
      }

      mats.forEach((m: any) => {
        const prog = Number(m.progresso || 0);
        if (m.status === 'CONCLUIDA' || prog >= 100) {
          concluidas += 1;
        } else {
          ativas += 1;
        }

        // 1º tenta ler valorPago direto da matrícula; 2º busca pelo ID ou nome do curso no catálogo
        const valorDireto = m.valorPago ?? m.preco ?? m.valor;
        if (valorDireto !== undefined && valorDireto !== null) {
          receitaTotal += Number(valorDireto);
        } else {
          const idCurso = String(m.cursoId ?? m.idCurso ?? m.curso?.id ?? '');
          const nomeCurso = String(
            m.nomeCurso || m.tituloCurso || m.cursoTitulo || m.titulo || m.curso?.titulo || ''
          )
            .toLowerCase()
            .trim();

          const precoEncontrado =
            (idCurso && mapaPrecosCursos.porId[idCurso]) ||
            (nomeCurso && mapaPrecosCursos.porTitulo[nomeCurso]) ||
            0;

          receitaTotal += Number(precoEncontrado);
        }
      });
    });

    return { ativas, concluidas, receitaTotal, alunosComMatricula };
  }, [listaAlunos, mapaPrecosCursos]);

  const handleAlterarProgresso = async (matriculaId: string, novoProgresso: number) => {
    try {
      const novoStatus = novoProgresso >= 100 ? 'CONCLUIDA' : 'ATIVA';
      await atualizarStatusMutation.mutateAsync({
        id: matriculaId,
        data: {
          progresso: novoProgresso,
          status: novoStatus as any,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: getPainelAdministrativoQueryKey(),
      });
      showToast({
        type: 'success',
        title: 'Progresso atualizado!',
        message: `Definido para ${novoProgresso}% (${novoStatus}).`,
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Erro ao atualizar',
        message: 'Não foi possível atualizar o progresso da matrícula.',
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

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={listaAlunos}
        keyExtractor={(item: any, idx) => String(item.id || item.email || idx)}
        contentContainerStyle={{ padding: 16 }}
        refreshing={isRefetching}
        onRefresh={() => {
          refetch();
        }}
        ListHeaderComponent={
          <View className="mb-4">
            {/* 3 Cards de KPIs Executivos */}
            <View className="flex-row gap-2.5 mb-2.5">
              <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-[11px] font-poppins-bold text-gray-500 uppercase">
                    Usuários
                  </Text>
                  <Users size={16} color="#b30016" />
                </View>
                <Text className="text-2xl font-poppins-bold text-gray-900">
                  {totalElements}
                </Text>
                <Text className="text-[11px] font-poppins text-gray-500">
                  {kpis.alunosComMatricula} matriculados nesta pág.
                </Text>
              </View>

              <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-[11px] font-poppins-bold text-gray-500 uppercase">
                    Matrículas
                  </Text>
                  <GraduationCap size={16} color="#15803d" />
                </View>
                <Text className="text-2xl font-poppins-bold text-gray-900">
                  {kpis.ativas + kpis.concluidas}
                </Text>
                <Text className="text-[11px] font-poppins text-green-700">
                  {kpis.ativas} ativas • {kpis.concluidas} concl.
                </Text>
              </View>
            </View>

            {/* Card Financeiro */}
            <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-poppins-bold text-gray-500 uppercase">
                  Receita Estimada nas Matrículas
                </Text>
                <Text className="text-xl font-poppins-bold text-brand mt-0.5">
                  {formatCurrency(kpis.receitaTotal)}
                </Text>
              </View>
              <View className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center">
                <TrendingUp size={20} color="#b30016" />
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="bg-white rounded-2xl p-8 items-center border border-gray-100">
            <Text className="text-gray-700 font-poppins-semibold">
              Nenhum registro encontrado nesta página.
            </Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => {
          const matriculasAluno: any[] = Array.isArray(item.matriculas)
            ? item.matriculas
            : Array.isArray(item.cursos)
            ? item.cursos
            : [];

          return (
            <View className="bg-white rounded-2xl p-4 mb-3.5 shadow-sm border border-gray-100">
              <Text className="text-base font-poppins-bold text-gray-900">
                {item.nome || item.nomeAluno || 'Aluno WNS'}
              </Text>
              <Text className="text-xs font-poppins text-gray-500 mb-3">
                {item.email}
              </Text>

              {matriculasAluno.length === 0 ? (
                <Text className="text-xs font-poppins text-gray-400 italic">
                  Sem matrículas registradas.
                </Text>
              ) : (
                matriculasAluno.map((mat: any, mIdx: number) => {
                  const matId = String(mat.id || mat.matriculaId || mIdx);
                  const progAtual = Number(mat.progresso || 0);
                  const nomeDoCurso =
                    mat.nomeCurso ||
                    mat.tituloCurso ||
                    mat.cursoTitulo ||
                    mat.titulo ||
                    mat.curso?.titulo ||
                    'Curso';

                  return (
                    <View
                      key={matId}
                      className="bg-gray-50 rounded-xl p-3 mb-2 border border-gray-200"
                    >
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-xs font-poppins-bold text-gray-800 flex-1 mr-2">
                          {nomeDoCurso}
                        </Text>
                        <Text className="text-xs font-poppins-bold text-brand">
                          {mat.status || 'ATIVA'} ({progAtual}%)
                        </Text>
                      </View>

                      <View className="flex-row justify-between gap-1.5 mt-1">
                        {[0, 25, 50, 75, 100].map((pct) => {
                          const ativo = Math.round(progAtual) === pct;
                          return (
                            <TouchableOpacity
                              key={pct}
                              onPress={() => handleAlterarProgresso(matId, pct)}
                              className={`flex-1 py-1.5 rounded-lg items-center border ${
                                ativo
                                  ? 'bg-brand border-brand'
                                  : 'bg-white border-gray-300'
                              }`}
                            >
                              <Text
                                className={`text-xs font-poppins-bold ${
                                  ativo ? 'text-white' : 'text-gray-700'
                                }`}
                              >
                                {pct}%
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })
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
              <Text className="font-poppins-semibold text-xs ml-1 text-gray-900">
                Anterior
              </Text>
            </TouchableOpacity>

            <Text className="text-xs font-poppins text-gray-500">
              Página {page + 1} de {totalPages}
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
        }
      />
    </View>
  );
}