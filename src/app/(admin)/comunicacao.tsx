import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react-native';
import {
  useListar2 as useListarAvisos,
  useCriar2 as useCriarAviso,
  useDeletar1 as useDeletarAviso,
  getListar2QueryKey as getAvisosKey,
} from '../../api/generated/endpoints/aviso-controller/aviso-controller';
import {
  useListar1 as useListarFaqs,
  useCriar1 as useCriarFaq,
  useDeletar as useDeletarFaq,
  getListar1QueryKey as getFaqsKey,
} from '../../api/generated/endpoints/faq-controller/faq-controller';

export default function AdminComunicacaoScreen() {
  const queryClient = useQueryClient();
  const [mensagemAviso, setMensagemAviso] = useState('');
  const [perguntaFaq, setPerguntaFaq] = useState('');
  const [respostaFaq, setRespostaFaq] = useState('');

  const { data: avisosData } = useListarAvisos();
  const { data: faqsData } = useListarFaqs();

  const criarAvisoMutation = useCriarAviso();
  const deletarAvisoMutation = useDeletarAviso();
  const criarFaqMutation = useCriarFaq();
  const deletarFaqMutation = useDeletarFaq();

  const avisos = Array.isArray(avisosData) ? avisosData : [];
  const faqs = Array.isArray(faqsData) ? faqsData : [];

  const handlePublicarAviso = async () => {
    if (!mensagemAviso.trim()) return;
    try {
      await criarAvisoMutation.mutateAsync({ data: { mensagem: mensagemAviso.trim() } });
      await queryClient.invalidateQueries({ queryKey: getAvisosKey() });
      setMensagemAviso('');
    } catch {
      Alert.alert('Erro', 'Não foi possível publicar o aviso.');
    }
  };

  const handlePublicarFaq = async () => {
    if (!perguntaFaq.trim() || !respostaFaq.trim()) return;
    try {
      await criarFaqMutation.mutateAsync({
        data: { pergunta: perguntaFaq.trim(), resposta: respostaFaq.trim() },
      });
      await queryClient.invalidateQueries({ queryKey: getFaqsKey() });
      setPerguntaFaq('');
      setRespostaFaq('');
    } catch {
      Alert.alert('Erro', 'Não foi possível criar a FAQ.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 16 }}>
      {/* Novo Aviso */}
      <View className="bg-white rounded-2xl p-4 mb-5 border border-gray-100">
        <Text className="font-poppins-bold text-sm text-gray-900 mb-2">
          Publicar Novo Aviso no Mural
        </Text>
        <TextInput
          placeholder="Escreva o comunicado para os alunos..."
          value={mensagemAviso}
          onChangeText={setMensagemAviso}
          multiline
          className="border border-gray-200 rounded-xl px-3.5 py-2.5 font-poppins text-sm mb-3"
        />
        <TouchableOpacity
          onPress={handlePublicarAviso}
          className="bg-brand py-3 rounded-xl items-center"
        >
          <Text className="text-white font-poppins-bold text-xs">PUBLICAR AVISO</Text>
        </TouchableOpacity>

        {avisos.map((aviso: any) => (
          <View
            key={String(aviso.id)}
            className="flex-row items-center justify-between bg-gray-50 p-3 rounded-xl mt-2.5"
          >
            <Text className="font-poppins text-xs text-gray-800 flex-1 mr-2">
              {aviso.mensagem}
            </Text>
            <TouchableOpacity
              onPress={async () => {
                await deletarAvisoMutation.mutateAsync({ id: String(aviso.id) });
                await queryClient.invalidateQueries({ queryKey: getAvisosKey() });
              }}
            >
              <Trash2 size={18} color="#dc2626" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Nova FAQ */}
      <View className="bg-white rounded-2xl p-4 mb-8 border border-gray-100">
        <Text className="font-poppins-bold text-sm text-gray-900 mb-2">
          Adicionar Pergunta Frequente (FAQ)
        </Text>
        <TextInput
          placeholder="Pergunta (ex: Qual a duração do curso?)"
          value={perguntaFaq}
          onChangeText={setPerguntaFaq}
          className="border border-gray-200 rounded-xl px-3.5 py-2.5 font-poppins text-sm mb-2"
        />
        <TextInput
          placeholder="Resposta detalhada..."
          value={respostaFaq}
          onChangeText={setRespostaFaq}
          multiline
          className="border border-gray-200 rounded-xl px-3.5 py-2.5 font-poppins text-sm mb-3"
        />
        <TouchableOpacity
          onPress={handlePublicarFaq}
          className="bg-gray-900 py-3 rounded-xl items-center"
        >
          <Text className="text-white font-poppins-bold text-xs">ADICIONAR FAQ</Text>
        </TouchableOpacity>

        {faqs.map((faq: any) => (
          <View
            key={String(faq.id)}
            className="flex-row items-center justify-between bg-gray-50 p-3 rounded-xl mt-2.5"
          >
            <View className="flex-1 mr-2">
              <Text className="font-poppins-bold text-xs text-gray-900">
                {faq.pergunta}
              </Text>
              <Text className="font-poppins text-xs text-gray-600">
                {faq.resposta}
              </Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                await deletarFaqMutation.mutateAsync({ id: String(faq.id) });
                await queryClient.invalidateQueries({ queryKey: getFaqsKey() });
              }}
            >
              <Trash2 size={18} color="#dc2626" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}