import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
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
  useAlternarStatus as useAlternarStatusPromocao,
  getListarQueryKey as getListarPromocoesQueryKey,
} from '../../api/generated/endpoints/promocao-controller/promocao-controller';
import { formatCurrency } from '../../utils/formatters';

export default function AdminMarketingScreen() {
  const queryClient = useQueryClient();
  const [codigo, setCodigo] = useState('');
  const [valorDesconto, setValorDesconto] = useState('');

  const { data: cuponsData, isLoading: loadingCupons } = useListarCupons();
  const { data: promocoesData, isLoading: loadingPromos } = useListarPromocoes();

  const criarCupomMutation = useCriarCupom();
  const toggleCupomMutation = useAlternarStatusCupom();
  const togglePromoMutation = useAlternarStatusPromocao();

  const cupons = Array.isArray(cuponsData) ? cuponsData : [];
  const promocoes = Array.isArray(promocoesData) ? promocoesData : [];

  const handleCriarCupomRapido = async () => {
    const valorNum = parseFloat(valorDesconto.replace(',', '.'));
    if (!codigo.trim() || isNaN(valorNum) || valorNum <= 0) {
      Alert.alert('Atenção', 'Informe o código e um valor de desconto maior que zero.');
      return;
    }

    const agora = new Date();
    const trintaDiasDepois = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    try {
      await criarCupomMutation.mutateAsync({
        data: {
          codigo: codigo.trim().toUpperCase(),
          valor: valorNum,
          cuponInitialDate: agora.toISOString(),
          cuponExpiration: trintaDiasDepois.toISOString(),
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListarCuponsQueryKey() });
      setCodigo('');
      setValorDesconto('');
      Alert.alert('Cupão Criado!', 'Ative o interruptor do cupão abaixo para liberá-lo para uso.');
    } catch {
      Alert.alert('Erro', 'Verifique se este código de cupão já existe.');
    }
  };

  const handleToggleCupom = async (id: string, status: boolean) => {
    try {
      await toggleCupomMutation.mutateAsync({ id, params: { status } } as any);
      await queryClient.invalidateQueries({ queryKey: getListarCuponsQueryKey() });
    } catch {
      Alert.alert('Erro', 'Não foi possível alterar o estado do cupão.');
    }
  };

  const handleTogglePromo = async (id: string, status: boolean) => {
    try {
      await togglePromoMutation.mutateAsync({ id, params: { status } } as any);
      await queryClient.invalidateQueries({ queryKey: getListarPromocoesQueryKey() });
    } catch {
      Alert.alert('Erro', 'Não foi possível alterar o estado da promoção.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 16 }}>
      {/* Criador Rápido de Cupão */}
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
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 font-poppins text-sm"
          />
          <TextInput
            placeholder="Valor R$ (50.00)"
            value={valorDesconto}
            onChangeText={setValorDesconto}
            keyboardType="decimal-pad"
            className="w-36 border border-gray-200 rounded-xl px-3 py-2 font-poppins text-sm"
          />
        </View>
        <TouchableOpacity
          onPress={handleCriarCupomRapido}
          disabled={criarCupomMutation.isPending}
          className="bg-brand py-3 rounded-xl items-center"
        >
          <Text className="text-white font-poppins-bold text-xs">CRIAR CUPÃO</Text>
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

      {/* Lista de Promoções */}
      <Text className="font-poppins-bold text-base text-gray-900 mt-5 mb-2">
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
                <Text className="font-poppins text-xs text-green-700">
                  Novo valor: {formatCurrency(promo.novoValor)}
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