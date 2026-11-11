import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useAccessibilityStore } from '../../store/accessibility-store';

export function AccessibilityWrapper({ children }: { children: React.ReactNode }) {
  const { fontScale, darkMode, highContrast, colorBlindMode } = useAccessibilityStore();
  const { width, height } = useWindowDimensions();

  const overlayTint = {
    NONE: null,
    PROTANOPIA: 'rgba(0, 114, 178, 0.15)',
    DEUTERANOPIA: 'rgba(230, 159, 0, 0.15)',
    TRITANOPIA: 'rgba(204, 121, 167, 0.15)',
    MONOCHROME: 'rgba(0, 0, 0, 0.45)',
  };

  // Cor de fundo base: Preto no Alto Contraste, Cinza-Azulado Fosco (#0f172a) no Dark Mode, e Claro no Light Mode
  const bgColor = highContrast ? '#000000' : darkMode ? '#0f172a' : '#f6f6f6';

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <View
        key={`theme-${darkMode ? 'dark' : 'light'}-${highContrast ? 'hc' : 'std'}`}
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

      {(colorBlindMode !== 'NONE' || highContrast) && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: overlayTint[colorBlindMode] || 'transparent',
            borderWidth: highContrast ? 3 : 0,
            borderColor: '#ffb400',
          }}
        />
      )}
    </View>
  );
}