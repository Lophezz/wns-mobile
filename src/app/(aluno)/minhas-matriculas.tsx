import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
  TextInput,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  Award,
  CheckCircle,
  Clock,
  FileText,
  Download,
  X,
  BookOpen,
  UserCheck,
} from 'lucide-react-native';
import { useListarMinhasMatriculas } from '../../api/generated/endpoints/matricula-controller/matricula-controller';
import { useListarCursos } from '../../api/generated/endpoints/curso-controller/curso-controller';
import { useListarMateriais } from '../../api/generated/endpoints/material-curso-controller/material-curso-controller';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToastStore } from '../../store/toast-store';
import { useAuthStore } from '../../store/auth-store';

// Tenta extrair o nome do aluno de dentro do Token JWT caso o back-end envie na claim "nome" ou "name"
function extrairNomeDoToken(token: string | null): string {
  if (!token) return '';
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return '';
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return payload.nomeCompleto || payload.nome || payload.name || '';
  } catch {
    return '';
  }
}

export default function MinhasMatriculasScreen() {
  const showToast = useToastStore((s) => s.showToast);
  const { email: emailAluno, token } = useAuthStore();

  const { data, isLoading, isError, refetch, isRefetching } = useListarMinhasMatriculas();
  const { data: catalogoData } = useListarCursos();

  const [cursoMateriaisModal, setCursoMateriaisModal] = useState<{
    cursoId: string;
    titulo: string;
  } | null>(null);

  // Estado do Modal para confirmar o Nome Completo no Certificado
  const [certificadoModal, setCertificadoModal] = useState<{
    item: any;
    nomeDoCurso: string;
    cargaHoraria: number;
  } | null>(null);
  const [nomeParaCertificado, setNomeParaCertificado] = useState('');
  const [gerandoCertificadoId, setGerandoCertificadoId] = useState<string | null>(null);

  const nomeDoJwt = useMemo(() => extrairNomeDoToken(token), [token]);

  const matriculas = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.content)
    ? (data as any).content
    : [];

  const catalogo = Array.isArray(catalogoData)
    ? catalogoData
    : Array.isArray((catalogoData as any)?.content)
    ? (catalogoData as any).content
    : [];

  const { data: materiaisData, isLoading: loadingMateriais } = useListarMateriais(
    cursoMateriaisModal?.cursoId || '',
    {
      query: { enabled: !!cursoMateriaisModal?.cursoId },
    }
  );

  const materiais = Array.isArray(materiaisData)
    ? materiaisData
    : Array.isArray((materiaisData as any)?.content)
    ? (materiaisData as any).content
    : [];

  const obterCursoDaMatricula = (item: any) => {
    const idDireto = item.cursoId ?? item.idCurso ?? item.curso?.id;
    const nomeMat = String(
      item.nomeCurso || item.tituloCurso || item.cursoTitulo || item.titulo || ''
    )
      .toLowerCase()
      .trim();

    const encontrado = catalogo.find(
      (c: any) =>
        (idDireto && String(c.id) === String(idDireto)) ||
        String(c.titulo || '').toLowerCase().trim() === nomeMat
    );

    return {
      cursoId: idDireto ? String(idDireto) : encontrado?.id ? String(encontrado.id) : '',
      cargaHoraria: item.cargaHoraria || encontrado?.cargaHoraria || 40,
    };
  };

  // Abre o modal já preenchendo o nome se vier da API ou do Token
  const abrirConfirmacaoCertificado = (item: any, nomeDoCurso: string, cargaHoraria: number) => {
    const nomeDetectado =
      item.nomeAluno ||
      item.nomeCompleto ||
      item.nome ||
      item.aluno?.nomeCompleto ||
      item.aluno?.nome ||
      nomeDoJwt ||
      '';

    if (!nomeParaCertificado.trim() && nomeDetectado) {
      setNomeParaCertificado(String(nomeDetectado));
    }

    setCertificadoModal({ item, nomeDoCurso, cargaHoraria });
  };

  // Gera e compartilha/salva o Certificado Oficial em PDF da WNS School
  const handleEmitirCertificado = async () => {
    if (!certificadoModal) return;

    const nomeFinal = nomeParaCertificado.trim();
    if (nomeFinal.length < 3) {
      showToast({
        type: 'warning',
        title: 'Informe seu nome completo',
        message: 'Digite seu nome como deseja que apareça no certificado.',
      });
      return;
    }

    const { item, nomeDoCurso, cargaHoraria } = certificadoModal;
    const idMat = String(item.id || item.matriculaId || nomeDoCurso);

    try {
      setGerandoCertificadoId(idMat);
      const dataEmissao = formatDate(new Date().toISOString());
      const codigoValidacao = `WNS-${idMat.slice(0, 8).toUpperCase()}-${new Date().getFullYear()}`;

      const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 landscape; margin: 0; }
            body {
              margin: 0;
              padding: 36px;
              font-family: Helvetica, Arial, sans-serif;
              background-color: #f8fafc;
              box-sizing: border-box;
            }
            .border-outer {
              border: 10px solid #b30016;
              padding: 12px;
              background: #ffffff;
              height: 680px;
              box-sizing: border-box;
            }
            .border-inner {
              border: 3px solid #ffb400;
              height: 100%;
              padding: 40px 60px;
              box-sizing: border-box;
              text-align: center;
            }
            .badge {
              display: inline-block;
              background: #b30016;
              color: #ffb400;
              font-weight: bold;
              padding: 8px 24px;
              border-radius: 30px;
              font-size: 14px;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            h1 {
              color: #111827;
              font-size: 38px;
              margin: 18px 0 6px 0;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
            .subtitle {
              color: #6b7280;
              font-size: 16px;
              margin-bottom: 24px;
            }
            .student-name {
              font-size: 32px;
              font-weight: bold;
              color: #b30016;
              border-bottom: 2px solid #e5e7eb;
              display: inline-block;
              padding: 0 36px 8px 36px;
              margin: 10px 0 20px 0;
              text-transform: capitalize;
            }
            .course-text {
              font-size: 18px;
              color: #374151;
              line-height: 1.6;
              max-width: 760px;
              margin: 0 auto;
            }
            .course-title {
              font-weight: bold;
              color: #111827;
              font-size: 22px;
            }
            .footer {
              margin-top: 70px;
              padding-top: 20px;
              border-top: 1px solid #f3f4f6;
              font-size: 13px;
              color: #6b7280;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .signature {
              border-top: 2px solid #111827;
              padding-top: 6px;
              width: 240px;
              color: #111827;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="border-outer">
            <div class="border-inner">
              <div>
                <span class="badge">WNS SCHOOL • ESCOLA DE IDIOMAS E TECNOLOGIA</span>
                <h1>Certificado de Conclusão</h1>
                <div class="subtitle">Certificamos para os devidos fins acadêmicos e profissionais que</div>
                <div class="student-name">${nomeFinal}</div>
                <div class="course-text">
                  concluiu com <strong>100% de aproveitamento</strong> o curso de formação<br/>
                  <span class="course-title">${nomeDoCurso}</span><br/>
                  com carga horária total estimada de <strong>${cargaHoraria} horas</strong>.
                </div>
              </div>

              <div class="footer">
                <div style="text-align: left;">
                  <strong>Data de Emissão:</strong> ${dataEmissao}<br/>
                  <strong>E-mail do Aluno:</strong> ${emailAluno || '-'}<br/>
                  <strong>Código de Validação:</strong> ${codigoValidacao}
                </div>
                <div class="signature">
                  Diretoria Acadêmica<br/>
                  <span style="font-weight: normal; font-size: 11px; color: #6b7280;">WNS School Brasil</span>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      setCertificadoModal(null);

      try {
        const file = await Print.printToFileAsync({ html });
        const canShare = await Sharing.isAvailableAsync();

        if (canShare && file?.uri) {
          await Sharing.shareAsync(file.uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Certificado - ${nomeDoCurso}`,
            UTI: 'com.adobe.pdf',
          });
          return;
        }
      } catch {
        // Fallback automático abaixo caso o compartilhamento falhe no emulador
      }

      await Print.printAsync({ html });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Erro ao gerar certificado',
        message: err?.message || 'Não foi possível criar o arquivo PDF do certificado.',
      });
    } finally {
      setGerandoCertificadoId(null);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#b30016" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-surface items-center justify-center p-6">
        <Text className="text-gray-700 font-poppins-semibold mb-4 text-center">
          Não foi possível carregar suas matrículas no momento.
        </Text>
        <TouchableOpacity onPress={() => refetch()} className="bg-brand px-5 py-3 rounded-xl">
          <Text className="text-white font-poppins-bold">Atualizar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={matriculas}
        keyExtractor={(item: any, idx) => String(item.id || item.matriculaId || idx)}
        contentContainerStyle={{ padding: 16 }}
        refreshing={isRefetching}
        onRefresh={() => {
          refetch();
        }}
        ListEmptyComponent={
          <View className="bg-white rounded-2xl p-8 items-center border border-gray-100 mt-4">
            <Award size={44} color="#9ca3af" />
            <Text className="text-gray-800 font-poppins-bold text-base mt-3">
              Nenhuma matrícula ativa
            </Text>
            <Text className="text-gray-500 font-poppins text-sm text-center mt-1">
              Explore o catálogo de cursos para iniciar seus estudos na WNS School.
            </Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => {
          const progresso = Number(item.progresso || 0);
          const concluida = item.status === 'CONCLUIDA' || progresso >= 100;
          const nomeDoCurso =
            item.nomeCurso ||
            item.tituloCurso ||
            item.cursoTitulo ||
            item.titulo ||
            item.curso?.titulo ||
            'Curso WNS';
          const { cursoId, cargaHoraria } = obterCursoDaMatricula(item);
          const idMat = String(item.id || item.matriculaId || nomeDoCurso);

          return (
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
              <View className="flex-row justify-between items-center mb-2">
                <View
                  className={`px-3 py-1 rounded-full flex-row items-center ${
                    concluida ? 'bg-green-100' : 'bg-blue-50'
                  }`}
                >
                  {concluida ? (
                    <CheckCircle size={14} color="#15803d" />
                  ) : (
                    <Clock size={14} color="#1d4ed8" />
                  )}
                  <Text
                    className={`text-xs font-poppins-bold ml-1.5 ${
                      concluida ? 'text-green-800' : 'text-blue-800'
                    }`}
                  >
                    {concluida ? 'CONCLUÍDO (100%)' : item.status || 'EM ANDAMENTO'}
                  </Text>
                </View>

                {(item.createdAt || item.dataMatricula) && (
                  <Text className="text-xs font-poppins text-gray-400">
                    Início: {formatDate(item.createdAt || item.dataMatricula)}
                  </Text>
                )}
              </View>

              <Text className="text-lg font-poppins-bold text-gray-900 mb-3">
                {nomeDoCurso}
              </Text>

              {/* Barra de Progresso */}
              <View className="mb-3">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs font-poppins-semibold text-gray-600">
                    Progresso do Curso
                  </Text>
                  <Text className="text-xs font-poppins-bold text-brand">
                    {progresso.toFixed(0)}%
                  </Text>
                </View>
                <View className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    style={{ width: `${Math.min(100, progresso)}%` }}
                    className={`h-full ${concluida ? 'bg-green-600' : 'bg-brand'}`}
                  />
                </View>
              </View>

              {item.valorPago !== undefined && (
                <Text className="text-xs font-poppins text-gray-500 pt-2 pb-3 border-t border-gray-100">
                  Valor registrado na matrícula: {formatCurrency(item.valorPago)}
                </Text>
              )}

              {/* Botão de Materiais Didáticos (PDF) */}
              <TouchableOpacity
                onPress={() => {
                  if (!cursoId) {
                    showToast({
                      type: 'warning',
                      title: 'Curso não identificado',
                      message: 'Atualize o catálogo de cursos e tente novamente.',
                    });
                    return;
                  }
                  setCursoMateriaisModal({ cursoId, titulo: nomeDoCurso });
                }}
                className="bg-brand py-3 px-4 rounded-xl flex-row items-center justify-center mt-1"
              >
                <FileText size={16} color="#ffffff" />
                <Text className="text-white font-poppins-bold text-xs ml-2">
                  ACESSAR MATERIAIS E APOSTILAS (PDF)
                </Text>
              </TouchableOpacity>

              {/* Botão Dourado de Certificado quando o curso atinge 100% */}
              {concluida && (
                <TouchableOpacity
                  onPress={() => abrirConfirmacaoCertificado(item, nomeDoCurso, cargaHoraria)}
                  disabled={gerandoCertificadoId === idMat}
                  style={{ backgroundColor: '#ffb400' }}
                  className="py-3.5 px-4 rounded-xl flex-row items-center justify-center mt-2.5 shadow-sm"
                >
                  {gerandoCertificadoId === idMat ? (
                    <ActivityIndicator color="#111827" size="small" />
                  ) : (
                    <>
                      <Award size={18} color="#111827" />
                      <Text className="text-gray-900 font-poppins-bold text-xs ml-2">
                        BAIXAR CERTIFICADO DE CONCLUSÃO (PDF)
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* Modal de Confirmação do Nome Completo para o Certificado */}
      <Modal visible={!!certificadoModal} animationType="fade" transparent>
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white rounded-3xl p-6">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <UserCheck size={20} color="#b30016" />
                <Text className="text-base font-poppins-bold text-gray-900 ml-2">
                  Emissão de Certificado
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCertificadoModal(null)}>
                <X size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs font-poppins text-gray-500 mb-3">
              Confirme como seu <Text className="font-poppins-bold text-gray-800">Nome Completo</Text> deve aparecer impresso no diploma oficial do curso{' '}
              <Text className="font-poppins-bold text-brand">
                {certificadoModal?.nomeDoCurso}
              </Text>
              :
            </Text>

            <TextInput
              placeholder="Digite seu nome e sobrenome completos..."
              value={nomeParaCertificado}
              onChangeText={setNomeParaCertificado}
              autoCapitalize="words"
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-poppins-semibold text-sm text-gray-900 mb-4"
            />

            <TouchableOpacity
              onPress={handleEmitirCertificado}
              style={{ backgroundColor: '#ffb400' }}
              className="py-3.5 rounded-xl flex-row items-center justify-center"
            >
              <Award size={18} color="#111827" />
              <Text className="text-gray-900 font-poppins-bold text-xs ml-2">
                GERAR MEU CERTIFICADO AGORA
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Apostilas e PDFs do Aluno */}
      <Modal visible={!!cursoMateriaisModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center">
                <BookOpen size={20} color="#b30016" />
                <Text className="text-lg font-poppins-bold text-gray-900 ml-2">
                  Materiais do Curso
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCursoMateriaisModal(null)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs font-poppins text-gray-500 mb-4">
              {cursoMateriaisModal?.titulo}
            </Text>

            {loadingMateriais ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="large" color="#b30016" />
                <Text className="text-xs font-poppins text-gray-500 mt-2">
                  Buscando materiais em PDF...
                </Text>
              </View>
            ) : materiais.length === 0 ? (
              <View className="bg-gray-50 p-6 rounded-2xl items-center border border-gray-100 my-4">
                <FileText size={36} color="#9ca3af" />
                <Text className="font-poppins-bold text-sm text-gray-800 mt-2">
                  Nenhum PDF disponível ainda
                </Text>
                <Text className="font-poppins text-xs text-gray-500 text-center mt-1">
                  O professor ou administrador ainda não publicou apostilas para este curso.
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {materiais.map((mat: any, index: number) => (
                  <TouchableOpacity
                    key={String(mat?.id ?? index)}
                    onPress={() => {
                      if (mat.downloadUrl) {
                        Linking.openURL(mat.downloadUrl);
                      } else {
                        showToast({
                          type: 'error',
                          title: 'Link indisponível',
                          message: 'Este arquivo não possui uma URL de download válida.',
                        });
                      }
                    }}
                    className="flex-row items-center justify-between bg-gray-50 p-4 rounded-2xl mb-3 border border-gray-200"
                  >
                    <View className="flex-row items-center flex-1 mr-3">
                      <View className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center mr-3">
                        <FileText size={20} color="#b30016" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-poppins-bold text-sm text-gray-900">
                          {mat.titulo || `Apostila #${index + 1}`}
                        </Text>
                        {mat.createdAt && (
                          <Text className="font-poppins text-xs text-gray-500">
                            Publicado em {formatDate(mat.createdAt)}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View className="bg-brand px-3 py-2 rounded-xl flex-row items-center">
                      <Download size={14} color="#ffffff" />
                      <Text className="text-white font-poppins-bold text-xs ml-1">
                        ABRIR PDF
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}