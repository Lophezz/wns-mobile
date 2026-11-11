import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, Edit2, X } from 'lucide-react-native';
import {
  useListar2 as useListarAvisos,
  useCriar2 as useCriarAviso,
  useAtualizarAviso,
  useDeletar1 as useDeletarAviso,
  getListar2QueryKey as getAvisosKey,
} from '../../api/generated/endpoints/aviso-controller/aviso-controller';
import {
  useListar1 as useListarFaqs,
  useCriar1 as useCriarFaq,
  useAtualizarFaq,
  useDeletar as useDeletarFaq,
  getListar1QueryKey as getFaqsKey,
} from '../../api/generated/endpoints/faq-controller/faq-controller';
import { useToastStore } from '../../store/toast-store';

export default function AdminComunicacaoScreen() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);

  // Estados de Aviso
  const [avisoEditandoId, setAvisoEditandoId] = useState<string | null>(null);
  const [mensagemAviso, setMensagemAviso] = useState('');

  // Estados de FAQ
  const [faqEditandoId, setFaqEditandoId] = useState<string | null>(null);
  const [perguntaFaq, setPerguntaFaq] = useState('');
  const [respostaFaq, setRespostaFaq] = useState('');

  const { data: avisosData } = useListarAvisos();
  const { data: faqsData } = useListarFaqs();

  const criarAvisoMutation = useCriarAviso();
  const atualizarAvisoMutation = useAtualizarAviso();
  const deletarAvisoMutation = useDeletarAviso();

  const criarFaqMutation = useCriarFaq();
  const atualizarFaqMutation = useAtualizarFaq();
  const deletarFaqMutation = useDeletarFaq();

  const avisos = Array.isArray(avisosData) ? avisosData : [];
  const faqs = Array.isArray(faqsData) ? faqsData : [];

  const handleSalvarAviso = async () => {
    if (!mensagemAviso.trim()) {
      showToast({ type: 'warning', title: 'Atenção', message: 'Digite a mensagem do aviso.' });
      return;
    }
    try {
      if (avisoEditandoId) {
        await atualizarAvisoMutation.mutateAsync({
          id: avisoEditandoId,
          data: { mensagem: mensagemAviso.trim() },
        });
        showToast({ type: 'success', title: 'Aviso atualizado com sucesso!' });
      } else {
        await criarAvisoMutation.mutateAsync({
          data: { mensagem: mensagemAviso.trim() },
        });
        showToast({ type: 'success', title: 'Aviso publicado no mural!' });
      }
      await queryClient.invalidateQueries({ queryKey: getAvisosKey() });
      setMensagemAviso('');
      setAvisoEditandoId(null);
    } catch {
      showToast({ type: 'error', title: 'Erro', message: 'Não foi possível salvar o aviso.' });
    }
  };

  const handleSalvarFaq = async () => {
    if (!perguntaFaq.trim() || !respostaFaq.trim()) {
      showToast({
        type: 'warning',
        title: 'Atenção',
        message: 'Preencha a pergunta e a resposta.',
      });
      return;
    }
    try {
      if (faqEditandoId) {
        await atualizarFaqMutation.mutateAsync({
          id: faqEditandoId,
          data: {
            pergunta: perguntaFaq.trim(),
            resposta: respostaFaq.trim(),
          },
        });
        showToast({ type: 'success', title: 'FAQ atualizada com sucesso!' });
      } else {
        await criarFaqMutation.mutateAsync({
          data: {
            pergunta: perguntaFaq.trim(),
            resposta: respostaFaq.trim(),
          },
        });
        showToast({ type: 'success', title: 'Nova FAQ adicionada!' });
      }
      await queryClient.invalidateQueries({ queryKey: getFaqsKey() });
      setPerguntaFaq('');
      setRespostaFaq('');
      setFaqEditandoId(null);
    } catch {
      showToast({ type: 'error', title: 'Erro', message: 'Não foi possível salvar a FAQ.' });
    }
  };

  const salvandoAviso = criarAvisoMutation.isPending || atualizarAvisoMutation.isPending;
  const salvandoFaq = criarFaqMutation.isPending || atualizarFaqMutation.isPending;

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Bloco de Avisos */}
      <View className="bg-white rounded-2xl p-4 mb-5 border border-gray-100">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="font-poppins-bold text-sm text-gray-900">
            {avisoEditandoId ? '✏️ Editando Aviso Selecionado' : 'Publicar Novo Aviso no Mural'}
          </Text>
          {avisoEditandoId && (
            <TouchableOpacity
              onPress={() => {
                setAvisoEditandoId(null);
                setMensagemAviso('');
              }}
              className="flex-row items-center bg-gray-100 px-2.5 py-1 rounded-lg"
            >
              <X size={14} color="#6b7280" />
              <Text className="text-xs font-poppins-semibold text-gray-600 ml-1">Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          placeholder="Escreva o comunicado para os alunos..."
          value={mensagemAviso}
          onChangeText={setMensagemAviso}
          multiline
          className="border border-gray-200 rounded-xl px-3.5 py-2.5 font-poppins text-sm text-gray-900 mb-3"
        />
        <TouchableOpacity
          onPress={handleSalvarAviso}
          disabled={salvandoAviso}
          className="bg-brand py-3 rounded-xl items-center"
        >
          {salvandoAviso ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text className="text-white font-poppins-bold text-xs">
              {avisoEditandoId ? 'SALVAR ALTERAÇÕES DO AVISO' : 'PUBLICAR AVISO'}
            </Text>
          )}
        </TouchableOpacity>

        {avisos.map((aviso: any, idx: number) => (
          <View
            key={String(aviso?.id ?? idx)}
            className="flex-row items-center justify-between bg-gray-50 p-3 rounded-xl mt-2.5 border border-gray-100"
          >
            <Text className="font-poppins text-xs text-gray-800 flex-1 mr-2">
              {aviso.mensagem}
            </Text>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => {
                  setAvisoEditandoId(String(aviso.id));
                  setMensagemAviso(aviso.mensagem || '');
                }}
                className="p-2 bg-blue-50 rounded-lg"
              >
                <Edit2 size={16} color="#2563eb" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await deletarAvisoMutation.mutateAsync({ id: String(aviso.id) });
                    await queryClient.invalidateQueries({ queryKey: getAvisosKey() });
                    showToast({ type: 'success', title: 'Aviso removido!' });
                  } catch {
                    showToast({ type: 'error', title: 'Erro ao remover aviso' });
                  }
                }}
                className="p-2 bg-red-50 rounded-lg"
              >
                <Trash2 size={16} color="#dc2626" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Bloco de FAQs */}
      <View className="bg-white rounded-2xl p-4 mb-8 border border-gray-100">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="font-poppins-bold text-sm text-gray-900">
            {faqEditandoId ? '✏️ Editando FAQ Selecionada' : 'Adicionar Pergunta Frequente (FAQ)'}
          </Text>
          {faqEditandoId && (
            <TouchableOpacity
              onPress={() => {
                setFaqEditandoId(null);
                setPerguntaFaq('');
                setRespostaFaq('');
              }}
              className="flex-row items-center bg-gray-100 px-2.5 py-1 rounded-lg"
            >
              <X size={14} color="#6b7280" />
              <Text className="text-xs font-poppins-semibold text-gray-600 ml-1">Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          placeholder="Pergunta (ex: Qual a duração do curso?)"
          value={perguntaFaq}
          onChangeText={setPerguntaFaq}
          className="border border-gray-200 rounded-xl px-3.5 py-2.5 font-poppins text-sm text-gray-900 mb-2"
        />
        <TextInput
          placeholder="Resposta detalhada..."
          value={respostaFaq}
          onChangeText={setRespostaFaq}
          multiline
          className="border border-gray-200 rounded-xl px-3.5 py-2.5 font-poppins text-sm text-gray-900 mb-3"
        />
        <TouchableOpacity
          onPress={handleSalvarFaq}
          disabled={salvandoFaq}
          className="bg-gray-900 py-3 rounded-xl items-center"
        >
          {salvandoFaq ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text className="text-white font-poppins-bold text-xs">
              {faqEditandoId ? 'SALVAR ALTERAÇÕES DA FAQ' : 'ADICIONAR FAQ'}
            </Text>
          )}
        </TouchableOpacity>

        {faqs.map((faq: any, idx: number) => (
          <View
            key={String(faq?.id ?? idx)}
            className="flex-row items-center justify-between bg-gray-50 p-3 rounded-xl mt-2.5 border border-gray-100"
          >
            <View className="flex-1 mr-2">
              <Text className="font-poppins-bold text-xs text-gray-900">
                {faq.pergunta}
              </Text>
              <Text className="font-poppins text-xs text-gray-600 mt-0.5">
                {faq.resposta}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => {
                  setFaqEditandoId(String(faq.id));
                  setPerguntaFaq(faq.pergunta || '');
                  setRespostaFaq(faq.resposta || '');
                }}
                className="p-2 bg-blue-50 rounded-lg"
              >
                <Edit2 size={16} color="#2563eb" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await deletarFaqMutation.mutateAsync({ id: String(faq.id) });
                    await queryClient.invalidateQueries({ queryKey: getFaqsKey() });
                    showToast({ type: 'success', title: 'FAQ removida!' });
                  } catch {
                    showToast({ type: 'error', title: 'Erro ao remover FAQ' });
                  }
                }}
                className="p-2 bg-red-50 rounded-lg"
              >
                <Trash2 size={16} color="#dc2626" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}