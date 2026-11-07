import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Clock, Tag, ChevronRight, Sparkles } from 'lucide-react-native';
import { useListarCursos } from '../../api/generated/endpoints/curso-controller/curso-controller';
import { formatCurrency } from '../../utils/formatters';

export default function CatalogoAlunoScreen() {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('TODOS');

  // Hook gerado pelo Orval para GET /cursos (respeitando cache de 2 min para evitar HTTP 429)
  const { data: cursos, isLoading, isError, error, refetch } = useListarCursos();

  const listaCursos = Array.isArray(cursos) ? cursos : [];

  // Extrai dinamicamente os tipos de curso cadastrados (ex: INGLES, INFORMATICA, etc.)
  const categorias = useMemo(() => {
    const tipos = new Set<string>();
    listaCursos.forEach((c: any) => {
      if (c.tipoCurso) tipos.add(c.tipoCurso.toUpperCase());
    });
    return ['TODOS', ...Array.from(tipos)];
  }, [listaCursos]);

  const cursosFiltrados = useMemo(() => {
    return listaCursos.filter((curso: any) => {
      const matchTexto =
        curso.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
        curso.descricao?.toLowerCase().includes(busca.toLowerCase());
      const matchCategoria =
        categoriaSelecionada === 'TODOS' ||
        curso.tipoCurso?.toUpperCase() === categoriaSelecionada;
      return matchTexto && matchCategoria;
    });
  }, [listaCursos, busca, categoriaSelecionada]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center p-6">
        <ActivityIndicator size="large" color="#b30016" />
        <Text className="text-gray-600 font-poppins mt-3">Carregando cursos disponíveis...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-surface items-center justify-center p-6">
        <Text className="text-red-700 font-poppins-bold text-lg text-center mb-2">
          Ops! Não foi possível carregar o catálogo
        </Text>
        <Text className="text-gray-600 font-poppins text-sm text-center mb-6">
          {(error as any)?.message || 'Aguarde alguns instantes e tente atualizar.'}
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
      {/* Barra de Busca e Categorias */}
      <View className="bg-white px-5 pt-4 pb-3 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3.5 py-2.5 mb-3">
          <Search size={18} color="#6b7280" />
          <TextInput
            placeholder="Buscar curso de inglês, excel, programação..."
            placeholderTextColor="#9ca3af"
            value={busca}
            onChangeText={setBusca}
            className="flex-1 ml-2.5 font-poppins text-sm text-gray-900"
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categorias}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const ativo = categoriaSelecionada === item;
            return (
              <TouchableOpacity
                onPress={() => setCategoriaSelecionada(item)}
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
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Lista de Cursos */}
      <FlatList
        data={cursosFiltrados}
        keyExtractor={(item: any) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-gray-500 font-poppins text-base">
              Nenhum curso encontrado.
            </Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => {
          const precoPromo = item.precoPromocional ?? item.novoValor ?? null;
          const temPromocao = precoPromo !== null && precoPromo < item.preco;

          return (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(aluno)/curso/[id]',
                  params: { id: String(item.id) },
                })
              }
              className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100"
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="bg-red-50 px-3 py-1 rounded-full">
                  <Text className="text-brand text-xs font-poppins-bold uppercase">
                    {item.tipoCurso || 'Curso WNS'}
                  </Text>
                </View>

                {temPromocao && (
                  <View className="flex-row items-center bg-amber-100 px-2.5 py-1 rounded-full">
                    <Sparkles size={12} color="#b45309" />
                    <Text className="text-amber-800 text-xs font-poppins-bold ml-1">
                      PROMOÇÃO
                    </Text>
                  </View>
                )}
              </View>

              <Text className="text-lg font-poppins-bold text-gray-900 mb-1">
                {item.titulo}
              </Text>
              <Text
                numberOfLines={2}
                className="text-sm font-poppins text-gray-600 mb-4"
              >
                {item.descricao}
              </Text>

              <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                <View className="flex-row items-center">
                  <Clock size={16} color="#6b7280" />
                  <Text className="text-xs font-poppins-semibold text-gray-600 ml-1.5">
                    {item.cargaHoraria}h de carga horária
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <View className="items-end mr-2">
                    {temPromocao ? (
                      <>
                        <Text className="text-xs font-poppins text-gray-400 line-through">
                          {formatCurrency(item.preco)}
                        </Text>
                        <Text className="text-base font-poppins-bold text-green-700">
                          {formatCurrency(precoPromo)}
                        </Text>
                      </>
                    ) : (
                      <Text className="text-base font-poppins-bold text-brand">
                        {formatCurrency(item.preco)}
                      </Text>
                    )}
                  </View>
                  <ChevronRight size={20} color="#b30016" />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}