import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  PanResponder,
  Animated,
  Dimensions,
  Switch,
} from 'react-native';
import { Accessibility, Type, Contrast, Eye, RotateCcw, X } from 'lucide-react-native';
import {
  useAccessibilityStore,
  ColorBlindMode,
} from '../../store/accessibility-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLOR_BLIND_OPTIONS: { key: ColorBlindMode; label: string; desc: string }[] = [
  { key: 'NONE', label: 'Padrão', desc: 'Cores originais da WNS' },
  { key: 'PROTANOPIA', label: 'Protanopia', desc: 'Suaviza tons vermelhos' },
  { key: 'DEUTERANOPIA', label: 'Deuteranopia', desc: 'Ajuste verde/vermelho' },
  { key: 'TRITANOPIA', label: 'Tritanopia', desc: 'Ajuste azul/amarelo' },
  { key: 'MONOCHROME', label: 'Monocromático', desc: 'Tons neutros de alto foco' },
];

export function FloatingAccessibilityButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const {
    fontScale,
    highContrast,
    colorBlindMode,
    setFontScale,
    toggleHighContrast,
    setColorBlindMode,
    resetAccessibility,
  } = useAccessibilityStore();

  // Posição inicial no canto direito da tela
  const pan = useRef(
    new Animated.ValueXY({ x: SCREEN_WIDTH - 68, y: SCREEN_HEIGHT * 0.65 })
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Só ativa o arraste se o dedo mover mais de 6px (para não bloquear o clique simples)
        return Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6;
      },
      onPanResponderGrant: () => {
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  // Filtro visual sobreposto para auxiliar na distinção cromática e alto contraste
  const overlayTint: Record<ColorBlindMode, string | null> = {
    NONE: null,
    PROTANOPIA: 'rgba(0, 114, 178, 0.09)',
    DEUTERANOPIA: 'rgba(230, 159, 0, 0.09)',
    TRITANOPIA: 'rgba(204, 121, 167, 0.09)',
    MONOCHROME: 'rgba(17, 24, 39, 0.18)',
  };

  return (
    <>
      {/* Camada de filtro óptico não-bloqueante (pointerEvents="none") */}
      {(colorBlindMode !== 'NONE' || highContrast) && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9990,
            backgroundColor: highContrast
              ? 'rgba(0, 0, 0, 0.14)'
              : overlayTint[colorBlindMode] || 'transparent',
            borderWidth: highContrast ? 2 : 0,
            borderColor: '#ffb400',
          }}
        />
      )}

      {/* Botão Flutuante Arrastável */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 9999,
          elevation: 50,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setModalOpen(true)}
          accessibilityLabel="Abrir menu de acessibilidade"
          accessibilityRole="button"
          className="w-14 h-14 rounded-full bg-gray-900 border-2 border-accent items-center justify-center shadow-lg"
        >
          <Accessibility size={26} color="#ffb400" />
        </TouchableOpacity>
      </Animated.View>

      {/* Modal de Configurações de Acessibilidade */}
      <Modal visible={modalOpen} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-end">
          <View
            className={`rounded-t-3xl p-6 ${
              highContrast ? 'bg-gray-950 border-t-2 border-accent' : 'bg-white'
            }`}
          >
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Accessibility size={22} color="#b30016" />
                <Text
                  style={{ fontSize: 18 * fontScale }}
                  className={`font-poppins-bold ml-2 ${
                    highContrast ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Acessibilidade
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalOpen(false)} className="p-1">
                <X size={24} color={highContrast ? '#ffffff' : '#6b7280'} />
              </TouchableOpacity>
            </View>

            {/* 1. Tamanho da Fonte */}
            <View className="mb-5">
              <View className="flex-row items-center mb-2">
                <Type size={18} color="#b30016" />
                <Text
                  style={{ fontSize: 13 * fontScale }}
                  className={`font-poppins-bold uppercase ml-2 ${
                    highContrast ? 'text-gray-200' : 'text-gray-700'
                  }`}
                >
                  Tamanho da Fonte
                </Text>
              </View>
              <View className="flex-row gap-2">
                {(
                  [
                    { scale: 1, label: 'A (100%)' },
                    { scale: 1.15, label: 'A+ (115%)' },
                    { scale: 1.3, label: 'A++ (130%)' },
                  ] as const
                ).map((item) => {
                  const ativo = fontScale === item.scale;
                  return (
                    <TouchableOpacity
                      key={item.scale}
                      onPress={() => setFontScale(item.scale)}
                      className={`flex-1 py-3 rounded-xl items-center border ${
                        ativo
                          ? 'bg-brand border-brand'
                          : highContrast
                          ? 'bg-gray-900 border-gray-700'
                          : 'bg-gray-100 border-gray-200'
                      }`}
                    >
                      <Text
                        className={`font-poppins-bold text-xs ${
                          ativo
                            ? 'text-white'
                            : highContrast
                            ? 'text-gray-200'
                            : 'text-gray-800'
                        }`}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. Alto Contraste */}
            <View className="flex-row items-center justify-between py-3 px-4 rounded-xl bg-gray-100 mb-5">
              <View className="flex-row items-center">
                <Contrast size={18} color="#b30016" />
                <View className="ml-2.5">
                  <Text className="font-poppins-bold text-sm text-gray-900">
                    Alto Contraste
                  </Text>
                  <Text className="font-poppins text-xs text-gray-500">
                    Reforça bordas e leitura para baixa visão
                  </Text>
                </View>
              </View>
              <Switch
                value={highContrast}
                onValueChange={toggleHighContrast}
                trackColor={{ false: '#d1d5db', true: '#b30016' }}
              />
            </View>

            {/* 3. Modo para Daltonismo */}
            <View className="mb-5">
              <View className="flex-row items-center mb-2">
                <Eye size={18} color="#b30016" />
                <Text
                  style={{ fontSize: 13 * fontScale }}
                  className={`font-poppins-bold uppercase ml-2 ${
                    highContrast ? 'text-gray-200' : 'text-gray-700'
                  }`}
                >
                  Modo de Daltonismo
                </Text>
              </View>

              <View className="flex-row flex-wrap gap-2">
                {COLOR_BLIND_OPTIONS.map((opt) => {
                  const selecionado = colorBlindMode === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => setColorBlindMode(opt.key)}
                      className={`px-3.5 py-2.5 rounded-xl border ${
                        selecionado
                          ? 'bg-brand border-brand'
                          : highContrast
                          ? 'bg-gray-900 border-gray-700'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <Text
                        className={`font-poppins-bold text-xs ${
                          selecionado
                            ? 'text-white'
                            : highContrast
                            ? 'text-gray-200'
                            : 'text-gray-900'
                        }`}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        className={`font-poppins text-[10px] ${
                          selecionado ? 'text-white/80' : 'text-gray-500'
                        }`}
                      >
                        {opt.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Botão Restaurar Padrão */}
            <TouchableOpacity
              onPress={resetAccessibility}
              className="flex-row items-center justify-center py-3.5 rounded-xl border border-gray-300 bg-gray-50"
            >
              <RotateCcw size={16} color="#374151" />
              <Text className="font-poppins-bold text-xs text-gray-800 ml-2">
                RESTAURAR PADRÕES
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}