import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useAccessibilityStore } from '../../store/accessibility-store';

export function AccessibilityWrapper({ children }: { children: React.ReactNode }) {
  const { fontScale, highContrast, colorBlindMode } = useAccessibilityStore();
  const { width, height } = useWindowDimensions();

  // Filtros ópticos recomendados para acessibilidade (Daltonismo)
  const overlayTint = {
    NONE: null,
    PROTANOPIA: 'rgba(0, 114, 178, 0.15)', // Filtro para dificuldade com Vermelho
    DEUTERANOPIA: 'rgba(230, 159, 0, 0.15)', // Filtro para dificuldade com Verde
    TRITANOPIA: 'rgba(204, 121, 167, 0.15)', // Filtro para dificuldade com Azul
    MONOCHROME: 'rgba(0, 0, 0, 0.45)', // Remove saturação geral
  };

  return (
    <View className={`flex-1 ${highContrast ? 'high-contrast bg-surface' : 'bg-surface'}`}>
      {/* 
        TRUQUE DE ZOOM GLOBAL:
        Calculamos uma tela menor proporcionalmente e depois damos scaleX/Y.
        Isso faz TODAS as fontes e botões crescerem no app inteiro sem quebrar 
        os cantos da tela e forçando o texto a descer de linha naturalmente!
      */}
      <View
        style={{
          width: width / fontScale,
          height: height / fontScale,
          transform: [
            { translateX: (width - width / fontScale) / 2 },
            { translateY: (height - height / fontScale) / 2 },
            { scale: fontScale },
          ],
        }}
      >
        {children}
      </View>

      {/* Camada Global de Contraste e Daltonismo (Cobre 100% da tela) */}
      {(colorBlindMode !== 'NONE' || highContrast) && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999, // Fica acima de todas as telas (mas não bloqueia o toque)
            backgroundColor: overlayTint[colorBlindMode] || 'transparent',
            borderWidth: highContrast ? 6 : 0,
            borderColor: '#ffb400', // Borda de alto foco visual
          }}
        />
      )}
    </View>
  );
}