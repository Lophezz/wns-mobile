import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListarCupons,
  useCriarCupom,
  useAlternarStatus1 as useAlternarStatusCupom,
  getListarCuponsQueryKey,
} from '../../api/generated/endpoints/cupom-controller/cupom-controller';
import {
  useListar as useListarPromocoes,
  useCriar as useCriarPromocao,
  useAlternarStatus as useAlternarStatusPromocao,
  getListarQueryKey as getListarPromocoesQueryKey,
} from '../../api/generated/endpoints/promocao-controller/promocao-controller';
import {
  useListarCursos,
  getListarCursosQueryKey,
} from '../../api/generated/endpoints/curso-controller/curso-controller';
import { formatCurrency } from '../../utils/formatters';
import { useToastStore } from '../../store/toast-store';

// Formata para java.time.LocalDateTime (sem o 'Z' de UTC que causa erro 400 no Spring)
const toJavaLocalDateTime = (date: Date) => date.toISOString().slice(0, 19);

export default function AdminMarketingScreen() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);

  // Estados para Novo Cupão
  const [codigo, setCodigo] = useState('');
  const [valorDesconto, setValorDesconto] = useState('');

  // Estados para Nova Promoção
  const [nomeCampanha, setNomeCampanha] = useState('');
  const [novoValorPromo, setNovoValorPromo] = useState('');
  const [cursoPromoId, setCursoPromoId] = useState<string>('');

  const { data: cuponsData, isLoading: loadingCupons } = useListarCupons();
  const { data: promocoesData, isLoading: loadingPromos } = useListarPromocoes();
  const { data: cursosAtivosData } = useListarCursos();

  const criarCupomMutation = useCriarCupom();
  const criarPromoMutation = useCriarPromocao();
  const toggleCupomMutation = useAlternarStatusCupom();
  const togglePromoMutation = useAlternarStatusPromocao();

  const cupons = Array.isArray(cuponsData) ? cuponsData : [];
  const promocoes = Array.isArray(promocoesData) ? promocoesData : [];
  const cursosAtivos = Array.isArray(cursosAtivosData) ? cursosAtivosData : [];

  const handleCriarCupomRapido = async () => {
    const valorNum = parseFloat(valorDesconto.replace(',', '.'));
    if (!codigo.trim() || isNaN(valorNum) || valorNum <= 0) {
      showToast({
        type: 'warning',
        title: 'Campos obrigatórios',
        message: 'Informe o código do cupão e um valor maior que zero.',
      });
      return;
    }

    const agora = new Date();
    const trintaDiasDepois = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    try {
      await criarCupomMutation.mutateAsync({
        data: {
          codigo: codigo.trim().toUpperCase(),
          valor: valorNum,
          cuponInitialDate: toJavaLocalDateTime(agora),
          cuponExpiration: toJavaLocalDateTime(trintaDiasDepois),
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListarCuponsQueryKey() });
      setCodigo('');
      setValorDesconto('');
      showToast({
        type: 'success',
        title: 'Cupão criado!',
        message: 'Ative o interruptor abaixo para liberá-lo aos alunos.',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Erro ao criar cupão',
        message: 'Verifique se este código já existe no sistema.',
      });
    }
  };

  const handleCriarPromocao = async () => {
    const valorNum = parseFloat(novoValorPromo.replace(',', '.'));
    if (!nomeCampanha.trim() || !cursoPromoId || isNaN(valorNum) || valorNum <= 0) {
      showToast({
        type: 'warning',
        title: 'Atenção',
        message: 'Preencha o nome da campanha, selecione um curso e informe o novo valor.',
      });
      return;
    }

    const agora = new Date();
    const trintaDiasDepois = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    try {
      await criarPromoMutation.mutateAsync({
        data: {
          nomeCampanha: nomeCampanha.trim(),
          cursoId: cursoPromoId,
          novoValor: valorNum,
          dataInicio: toJavaLocalDateTime(agora),
          dataExpiracao: toJavaLocalDateTime(trintaDiasDepois),
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListarPromocoesQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getListarCursosQueryKey() });
      setNomeCampanha('');
      setNovoValorPromo('');
      setCursoPromoId('');
      showToast({
        type: 'success',
        title: 'Campanha criada!',
        message: 'Ative a promoção na lista abaixo para aplicar o preço promocional.',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Erro ao criar promoção',
        message: 'Não foi possível registar a campanha promocional.',
      });
    }
  };

  const handleToggleCupom = async (id: string, status: boolean) => {
    try {
      await toggleCupomMutation.mutateAsync({ id, data: { status } });
      await queryClient.invalidateQueries({ queryKey: getListarCuponsQueryKey() });
      showToast({
        type: 'success',
        title: status ? 'Cupão Ativado' : 'Cupão Desativado',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível alterar o estado do cupão.',
      });
    }
  };

  const handleTogglePromo = async (id: string, status: boolean) => {
    try {
      await togglePromoMutation.mutateAsync({ id, data: { status } });
      await queryClient.invalidateQueries({ queryKey: getListarPromocoesQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getListarCursosQueryKey() });
      showToast({
        type: 'success',
        title: status ? 'Promoção Ativada!' : 'Promoção Desativada',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível alterar o estado da promoção.',
      });
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* 1. Criador de Cupão */}
      <View className="bg-white rounded-2xl p-4 mb-5 border border-gray-100 shadow-sm">
        <Text className="font-poppins-bold text-sm text-gray-900 mb-3">
          Criar Novo Cupão (Validade: 30 dias)
        </Text>
        <View className="flex-row gap-2 mb-3">
          <TextInput
            placeholder="Código (ex: WNS50)"
            value={codigo}
            onChangeText={setCodigo}
            autoCapitalize="characters"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 font-poppins text-sm text-gray-900"
          />
          <TextInput
            placeholder="Valor R$ (50.00)"
            value={valorDesconto}
            onChangeText={setValorDesconto}
            keyboardType="decimal-pad"
            className="w-36 border border-gray-200 rounded-xl px-3 py-2.5 font-poppins text-sm text-gray-900"
          />
        </View>
        <TouchableOpacity
          onPress={handleCriarCupomRapido}
          disabled={criarCupomMutation.isPending}
          className="bg-brand py-3 rounded-xl items-center"
        >
          {criarCupomMutation.isPending ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text className="text-white font-poppins-bold text-xs">CRIAR CUPÃO</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Lista de Cupões */}
      <Text className="font-poppins-bold text-base text-gray-900 mb-2">
        Cupões Cadastrados
      </Text>
      {loadingCupons ? (
        <ActivityIndicator color="#b30016" className="my-4" />
      ) : (
        cupons.map((cupom: any) => {
          const ativo = Boolean(cupom.isCupponActive ?? cupom.cupponActive);
          return (
            <View
              key={String(cupom.id)}
              className="bg-white rounded-xl p-4 mb-2.5 flex-row justify-between items-center border border-gray-100"
            >
              <View>
                <Text className="font-poppins-bold text-sm text-gray-900">
                  {cupom.codigo}
                </Text>
                <Text className="font-poppins text-xs text-brand">
                  Desconto: {formatCurrency(cupom.valor)}
                </Text>
              </View>
              <Switch
                value={ativo}
                onValueChange={(val) => handleToggleCupom(String(cupom.id), val)}
                trackColor={{ false: '#d1d5db', true: '#15803d' }}
              />
            </View>
          );
        })
      )}

      {/* 2. Criador de Campanha Promocional */}
      <View className="bg-white rounded-2xl p-4 mt-5 mb-5 border border-gray-100 shadow-sm">
        <Text className="font-poppins-bold text-sm text-gray-900 mb-3">
          Nova Campanha Promocional (30 dias)
        </Text>
        <View className="flex-row gap-2 mb-3">
          <TextInput
            placeholder="Campanha (ex: Turmas 2026)"
            value={nomeCampanha}
            onChangeText={setNomeCampanha}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 font-poppins text-sm text-gray-900"
          />
          <TextInput
            placeholder="Novo R$ (110.00)"
            value={novoValorPromo}
            onChangeText={setNovoValorPromo}
            keyboardType="decimal-pad"
            className="w-36 border border-gray-200 rounded-xl px-3 py-2.5 font-poppins text-sm text-gray-900"
          />
        </View>

        <Text className="text-xs font-poppins-semibold text-gray-600 mb-2">
          Selecione o Curso da Promoção:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {cursosAtivos.map((c: any) => {
            const selecionado = cursoPromoId === String(c.id);
            return (
              <TouchableOpacity
                key={String(c.id)}
                onPress={() => setCursoPromoId(String(c.id))}
                className={`mr-2 px-3.5 py-2 rounded-xl border ${
                  selecionado ? 'bg-brand border-brand' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Text
                  className={`font-poppins-bold text-xs ${
                    selecionado ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {c.titulo} ({formatCurrency(c.preco)})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          onPress={handleCriarPromocao}
          disabled={criarPromoMutation.isPending}
          className="bg-gray-900 py-3 rounded-xl items-center"
        >
          {criarPromoMutation.isPending ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text className="text-white font-poppins-bold text-xs">CRIAR PROMOÇÃO</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Lista de Promoções */}
      <Text className="font-poppins-bold text-base text-gray-900 mb-2">
        Campanhas Promocionais (/promocoes)
      </Text>
      {loadingPromos ? (
        <ActivityIndicator color="#b30016" className="my-4" />
      ) : (
        promocoes.map((promo: any) => {
          const ativa = Boolean(promo.isAtiva ?? promo.ativa);
          return (
            <View
              key={String(promo.id)}
              className="bg-white rounded-xl p-4 mb-2.5 flex-row justify-between items-center border border-gray-100"
            >
              <View className="flex-1 mr-3">
                <Text className="font-poppins-bold text-sm text-gray-900">
                  {promo.nomeCampanha}
                </Text>
                <Text className="font-poppins text-xs text-gray-500">
                  {promo.tituloCurso || ''}
                </Text>
                <Text className="font-poppins-bold text-xs text-green-700 mt-0.5">
                  Valor promocional: {formatCurrency(promo.novoValor)}
                </Text>
              </View>
              <Switch
                value={ativa}
                onValueChange={(val) => handleTogglePromo(String(promo.id), val)}
                trackColor={{ false: '#d1d5db', true: '#b30016' }}
              />
            </View>
          );
        })
      )}
    </ScrollView>
  );
}