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
  { key: 'MONOCHROME', label: 'Monocromático', desc: 'Tons neutros' },
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

  const pan = useRef(
    new Animated.ValueXY({ x: SCREEN_WIDTH - 68, y: SCREEN_HEIGHT * 0.65 })
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6;
      },
      onPanResponderGrant: () => pan.extractOffset(),
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => pan.flattenOffset(),
    })
  ).current;

  return (
    <>
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
          className="w-14 h-14 rounded-full bg-gray-900 border-2 border-accent items-center justify-center shadow-lg"
        >
          <Accessibility size={26} color="#ffb400" />
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={modalOpen} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="rounded-t-3xl p-6 bg-white border-t-4 border-brand">
            
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Accessibility size={22} color="#b30016" />
                <Text style={{ fontSize: 18 * fontScale }} className="font-poppins-bold ml-2 text-gray-900">
                  Acessibilidade
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalOpen(false)} className="p-1">
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* 1. Tamanho da Fonte */}
            <View className="mb-5">
              <View className="flex-row items-center mb-2">
                <Type size={18} color="#b30016" />
                <Text style={{ fontSize: 13 * fontScale }} className="font-poppins-bold uppercase ml-2 text-gray-700">
                  Tamanho da Fonte
                </Text>
              </View>
              <View className="flex-row gap-2">
                {([
                  { scale: 1, label: 'A (100%)' },
                  { scale: 1.15, label: 'A+ (115%)' },
                  { scale: 1.3, label: 'A++ (130%)' },
                ] as const).map((item) => (
                  <TouchableOpacity
                    key={item.scale}
                    onPress={() => setFontScale(item.scale)}
                    className={`flex-1 py-3 rounded-xl items-center border ${
                      fontScale === item.scale ? 'bg-brand border-brand' : 'bg-gray-100 border-gray-200'
                    }`}
                  >
                    <Text className={`font-poppins-bold text-xs ${fontScale === item.scale ? 'text-white' : 'text-gray-800'}`}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 2. Alto Contraste */}
            <View className="flex-row items-center justify-between py-3 px-4 rounded-xl bg-gray-100 mb-5 border border-gray-200">
              <View className="flex-row items-center">
                <Contrast size={18} color="#b30016" />
                <View className="ml-2.5">
                  <Text className="font-poppins-bold text-sm text-gray-900">Alto Contraste</Text>
                  <Text className="font-poppins text-xs text-gray-500">Inverte cores para baixa visão</Text>
                </View>
              </View>
              <Switch
                value={highContrast}
                onValueChange={toggleHighContrast}
                trackColor={{ false: '#d1d5db', true: '#b30016' }}
              />
            </View>

            {/* 3. Daltonismo */}
            <View className="mb-5">
              <View className="flex-row items-center mb-2">
                <Eye size={18} color="#b30016" />
                <Text style={{ fontSize: 13 * fontScale }} className="font-poppins-bold uppercase ml-2 text-gray-700">
                  Filtros de Daltonismo
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {COLOR_BLIND_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setColorBlindMode(opt.key)}
                    className={`px-3.5 py-2.5 rounded-xl border ${
                      colorBlindMode === opt.key ? 'bg-brand border-brand' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text className={`font-poppins-bold text-xs ${colorBlindMode === opt.key ? 'text-white' : 'text-gray-900'}`}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={resetAccessibility}
              className="flex-row items-center justify-center py-3.5 rounded-xl border border-gray-300 bg-gray-50"
            >
              <RotateCcw size={16} color="#374151" />
              <Text className="font-poppins-bold text-xs text-gray-800 ml-2">RESTAURAR PADRÕES</Text>
            </TouchableOpacity>
            
          </View>
        </View>
      </Modal>
    </>
  );
}