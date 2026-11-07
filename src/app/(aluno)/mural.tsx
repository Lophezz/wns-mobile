import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Megaphone, HelpCircle } from 'lucide-react-native';
import { useListar2 as useListarAvisos } from '../../api/generated/endpoints/aviso-controller/aviso-controller';
import { useListar1 as useListarFaqs } from '../../api/generated/endpoints/faq-controller/faq-controller';
import { formatDate } from '../../utils/formatters';

export default function MuralAlunoScreen() {
  const { data: avisosData, isLoading: loadingAvisos } = useListarAvisos();
  const { data: faqsData, isLoading: loadingFaqs } = useListarFaqs();

  const avisos = Array.isArray(avisosData) ? avisosData : [];
  const faqs = Array.isArray(faqsData) ? faqsData : [];

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 16 }}>
      {/* Seção de Avisos da Escola */}
      <View className="flex-row items-center mb-3">
        <Megaphone size={20} color="#b30016" />
        <Text className="text-lg font-poppins-bold text-gray-900 ml-2">
          Quadro de Avisos
        </Text>
      </View>

      {loadingAvisos ? (
        <ActivityIndicator color="#b30016" className="my-4" />
      ) : avisos.length === 0 ? (
        <View className="bg-white p-4 rounded-xl border border-gray-100 mb-6">
          <Text className="text-gray-500 font-poppins text-sm">
            Nenhum comunicado publicado recentemente.
          </Text>
        </View>
      ) : (
        <View className="mb-6">
          {avisos.map((aviso: any) => (
            <View
              key={String(aviso.id)}
              className="bg-brand-light border-l-4 border-brand p-4 rounded-r-xl mb-3 shadow-sm"
            >
              <Text className="text-gray-900 font-poppins text-sm leading-5">
                {aviso.mensagem}
              </Text>
              {aviso.dataCriacao && (
                <Text className="text-gray-500 font-poppins text-xs mt-2">
                  Publicado em {formatDate(aviso.dataCriacao)}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Seção de Perguntas Frequentes (FAQ) */}
      <View className="flex-row items-center mb-3">
        <HelpCircle size={20} color="#b30016" />
        <Text className="text-lg font-poppins-bold text-gray-900 ml-2">
          Perguntas Frequentes (FAQ)
        </Text>
      </View>

      {loadingFaqs ? (
        <ActivityIndicator color="#b30016" className="my-4" />
      ) : faqs.length === 0 ? (
        <View className="bg-white p-4 rounded-xl border border-gray-100">
          <Text className="text-gray-500 font-poppins text-sm">
            Nenhuma pergunta cadastrada no momento.
          </Text>
        </View>
      ) : (
        faqs.map((faq: any) => (
          <View
            key={String(faq.id)}
            className="bg-white p-4 rounded-xl border border-gray-100 mb-3 shadow-sm"
          >
            <Text className="text-brand font-poppins-bold text-sm mb-1.5">
              {faq.pergunta}
            </Text>
            <Text className="text-gray-600 font-poppins text-sm leading-5">
              {faq.resposta}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}