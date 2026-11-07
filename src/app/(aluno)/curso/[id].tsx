import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, Ticket, CheckCircle2, MessageCircle } from 'lucide-react-native';
import { useBuscarCursoPorId } from '../../../api/generated/endpoints/curso-controller/curso-controller';
import { validarCupom } from '../../../api/generated/endpoints/cupom-controller/cupom-controller';
import { formatCurrency } from '../../../utils/formatters';

export default function DetalheCursoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [codigoCupom, setCodigoCupom] = useState('');
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [descontoCupom, setDescontoCupom] = useState<number>(0);
  const [cupomAplicado, setCupomAplicado] = useState<string | null>(null);

  const { data: cursoData, isLoading } = useBuscarCursoPorId(String(id), {
    query: { enabled: !!id },
  });

  const curso: any = cursoData;

  const handleValidarCupom = async () => {
    if (!codigoCupom.trim()) {
      Alert.alert('Atenção', 'Digite o código do cupom.');
      return;
    }

    try {
      setValidandoCupom(true);
      const res: any = await validarCupom(codigoCupom.trim().toUpperCase(), {
        cursoId: String(id),
      } as any);

      const valorDesconto = Number(res?.valor || 0);
      setDescontoCupom(valorDesconto);
      setCupomAplicado(codigoCupom.trim().toUpperCase());
      Alert.alert(
        'Cupom Aplicado!',
        `Desconto de ${formatCurrency(valorDesconto)} validado para este curso.`
      );
    } catch (err: any) {
      setDescontoCupom(0);
      setCupomAplicado(null);
      Alert.alert(
        'Cupom inválido',
        'Este cupom não existe, expirou ou não é válido para este curso.'
      );
    } finally {
      setValidandoCupom(false);
    }
  };

  if (isLoading || !curso) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#b30016" />
      </View>
    );
  }

  const precoBase = Number(curso.precoPromocional ?? curso.novoValor ?? curso.preco ?? 0);
  const precoFinal = Math.max(0, precoBase - descontoCupom);

  const handleSolicitarMatriculaWhatsApp = () => {
    const msg = `Olá! Gostaria de concluir minha matrícula no curso *${curso.titulo}* (${formatCurrency(
      precoFinal
    )})${cupomAplicado ? ` utilizando o cupom *${cupomAplicado}*` : ''}.`;
    const url = `https://wa.me/5511952400814?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url);
  };

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 20 }}>
      <TouchableOpacity
        onPress={() => router.back()}
        className="flex-row items-center mb-4"
      >
        <ArrowLeft size={20} color="#b30016" />
        <Text className="text-brand font-poppins-semibold ml-2">Voltar ao catálogo</Text>
      </TouchableOpacity>

      <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-5">
        <View className="self-start bg-red-50 px-3 py-1 rounded-full mb-3">
          <Text className="text-brand text-xs font-poppins-bold uppercase">
            {curso.tipoCurso || 'Curso WNS'}
          </Text>
        </View>

        <Text className="text-2xl font-poppins-bold text-gray-900 mb-2">
          {curso.titulo}
        </Text>

        <View className="flex-row items-center mb-4">
          <Clock size={18} color="#6b7280" />
          <Text className="text-sm font-poppins-semibold text-gray-600 ml-2">
            Carga horária total: {curso.cargaHoraria} horas
          </Text>
        </View>

        <Text className="text-sm font-poppins text-gray-700 leading-6 mb-6">
          {curso.descricao}
        </Text>

        {/* Simulador de Cupom */}
        <View className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
          <View className="flex-row items-center mb-2">
            <Ticket size={18} color="#b30016" />
            <Text className="text-xs font-poppins-bold text-gray-800 uppercase ml-2">
              Possui um cupom de desconto?
            </Text>
          </View>

          <View className="flex-row gap-2">
            <TextInput
              placeholder="Ex: WNS2026"
              value={codigoCupom}
              onChangeText={setCodigoCupom}
              autoCapitalize="characters"
              className="flex-1 bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 font-poppins text-gray-900"
            />
            <TouchableOpacity
              onPress={handleValidarCupom}
              disabled={validandoCupom}
              className="bg-gray-900 px-4 rounded-xl items-center justify-center"
            >
              {validandoCupom ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text className="text-white font-poppins-bold text-xs">APLICAR</Text>
              )}
            </TouchableOpacity>
          </View>

          {cupomAplicado && (
            <View className="flex-row items-center mt-2.5">
              <CheckCircle2 size={16} color="#15803d" />
              <Text className="text-green-700 text-xs font-poppins-semibold ml-1.5">
                Cupom {cupomAplicado} aplicado (-{formatCurrency(descontoCupom)})
              </Text>
            </View>
          )}
        </View>

        {/* Resumo de Valor */}
        <View className="flex-row items-center justify-between mb-6 pt-4 border-t border-gray-100">
          <Text className="text-sm font-poppins-semibold text-gray-600">
            Investimento Final:
          </Text>
          <View className="items-end">
            {(descontoCupom > 0 || precoBase < Number(curso.preco)) && (
              <Text className="text-xs font-poppins text-gray-400 line-through">
                {formatCurrency(curso.preco)}
              </Text>
            )}
            <Text className="text-2xl font-poppins-bold text-brand">
              {formatCurrency(precoFinal)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSolicitarMatriculaWhatsApp}
          className="bg-green-600 py-4 rounded-xl flex-row items-center justify-center shadow-sm"
        >
          <MessageCircle size={20} color="#ffffff" />
          <Text className="text-white font-poppins-bold text-base ml-2">
            SOLICITAR MATRÍCULA
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}