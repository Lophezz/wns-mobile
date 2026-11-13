import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Clock,
  Tag,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Search,
  ArrowUpDown,
  X,
} from 'lucide-react-native';
import { useListarCursos } from '../../api/generated/endpoints/curso-controller/curso-controller';
import { formatCurrency } from '../../utils/formatters';

const CATEGORIAS = ['TODOS', 'PRESENCIAL', 'EAD', 'INGLES', 'INFORMATICA', 'EXCEL'] as const;

export default function CatalogoAlunoScreen() {
  const router = useRouter();
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('TODOS');
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [ordenarMenorPreco, setOrdenarMenorPreco] = useState<boolean>(false);

  const { data: cursosData, isLoading, isError, error, refetch, isRefetching } = useListarCursos({
    query: {
      staleTime: 1000 * 60 * 3,
      retry: false,
    },
  });

  const listaCursos = useMemo(() => {
    const raw = Array.isArray(cursosData)
      ? cursosData
      : Array.isArray((cursosData as any)?.content)
      ? (cursosData as any).content
      : [];

    const filtrados = raw.filter((c: any) => {
      const titulo = String(c.titulo || '').toUpperCase();
      const desc = String(c.descricao || '').toUpperCase();
      const tipo = String(c.tipoCurso || '').toUpperCase();

      const bateCategoria =
        categoriaAtiva === 'TODOS' ||
        tipo.includes(categoriaAtiva) ||
        titulo.includes(categoriaAtiva);

      const termo = buscaTexto.trim().toUpperCase();
      const bateTexto = !termo || titulo.includes(termo) || desc.includes(termo);

      return bateCategoria && bateTexto;
    });

    if (!ordenarMenorPreco) return filtrados;

    return [...filtrados].sort((a: any, b: any) => {
      const precoA = Number(a.precoPromocional ?? a.novoValor ?? a.preco ?? 0);
      const precoB = Number(b.precoPromocional ?? b.novoValor ?? b.preco ?? 0);
      return precoA - precoB;
    });
  }, [cursosData, categoriaAtiva, buscaTexto, ordenarMenorPreco]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center p-6">
        <ActivityIndicator size="large" color="#b30016" />
        <Text className="text-gray-600 font-poppins mt-3">
          Carregando cursos disponíveis...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-surface items-center justify-center p-6">
        <AlertCircle size={48} color="#b30016" />
        <Text className="text-lg font-poppins-bold text-gray-900 mt-3 text-center">
          Limite de requisições ou falha na rede
        </Text>
        <Text className="text-sm font-poppins text-gray-600 text-center mt-1 mb-5">
          {(error as any)?.message || 'Aguarde alguns segundos antes de atualizar.'}
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="bg-brand px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-poppins-bold">Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="bg-white pt-3 pb-2.5 px-4 border-b border-gray-100">
        <View className="flex-row items-center gap-2 mb-2.5">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
            <Search size={16} color="#6b7280" />
            <TextInput
              placeholder="Buscar curso pelo nome..."
              value={buscaTexto}
              onChangeText={setBuscaTexto}
              className="flex-1 ml-2 font-poppins text-xs text-gray-900"
            />
            {buscaTexto.length > 0 && (
              <TouchableOpacity onPress={() => setBuscaTexto('')}>
                <X size={16} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setOrdenarMenorPreco((v) => !v)}
            className={`flex-row items-center px-3 py-2.5 rounded-xl border ${
              ordenarMenorPreco
                ? 'bg-brand border-brand'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <ArrowUpDown size={14} color={ordenarMenorPreco ? '#ffffff' : '#374151'} />
            <Text
              className={`text-[11px] font-poppins-bold ml-1 ${
                ordenarMenorPreco ? 'text-white' : 'text-gray-700'
              }`}
            >
              Menor R$
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIAS.map((cat) => {
            const ativo = categoriaAtiva === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategoriaAtiva(cat)}
                className={`mr-2 px-4 py-1.5 rounded-full border ${
                  ativo
                    ? 'bg-brand border-brand'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Text
                  className={`text-xs font-poppins-semibold ${
                    ativo ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={listaCursos}
        keyExtractor={(item: any, index) => String(item?.id ?? index)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshing={isRefetching}
        onRefresh={() => {
          refetch();
        }}
        ListEmptyComponent={
          <View className="bg-white rounded-2xl p-8 items-center border border-gray-100 mt-4">
            <Text className="text-gray-800 font-poppins-bold text-base">
              Nenhum curso encontrado
            </Text>
            <Text className="text-gray-500 font-poppins text-xs mt-1 text-center">
              Tente outro termo de pesquisa ou mude a categoria selecionada.
            </Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => {
          const precoOriginal = Number(item.preco ?? 0);
          const precoPromo = item.precoPromocional ?? item.novoValor;
          const temPromocao =
            precoPromo !== undefined &&
            precoPromo !== null &&
            Number(precoPromo) < precoOriginal;

          return (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push(`/(aluno)/curso/${item.id}` as any)}
              className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100"
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="bg-red-50 px-3 py-1 rounded-full flex-row items-center">
                  <Tag size={12} color="#b30016" />
                  <Text className="text-brand text-xs font-poppins-bold ml-1.5 uppercase">
                    {item.tipoCurso || 'Curso'}
                  </Text>
                </View>

                {temPromocao && (
                  <View className="bg-amber-100 px-2.5 py-1 rounded-full flex-row items-center">
                    <Sparkles size={12} color="#b45309" />
                    <Text className="text-amber-800 text-xs font-poppins-bold ml-1">
                      Oferta Ativa
                    </Text>
                  </View>
                )}
              </View>

              <Text className="text-lg font-poppins-bold text-gray-900 mb-1">
                {item.titulo}
              </Text>

              <Text
                numberOfLines={2}
                className="text-gray-600 font-poppins text-xs mb-4 leading-5"
              >
                {item.descricao || 'Formação completa na WNS School.'}
              </Text>

              <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                <View className="flex-row items-center">
                  <Clock size={15} color="#6b7280" />
                  <Text className="text-gray-600 font-poppins-semibold text-xs ml-1.5">
                    {item.cargaHoraria || 0}h de carga
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <View className="items-end mr-2">
                    {temPromocao ? (
                      <>
                        <Text className="text-xs font-poppins text-gray-400 line-through">
                          {formatCurrency(precoOriginal)}
                        </Text>
                        <Text className="text-base font-poppins-bold text-green-700">
                          {formatCurrency(precoPromo)}
                        </Text>
                      </>
                    ) : (
                      <Text className="text-base font-poppins-bold text-brand">
                        {formatCurrency(precoOriginal)}
                      </Text>
                    )}
                  </View>
                  <ChevronRight size={18} color="#b30016" />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}