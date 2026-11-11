import React, { useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useAccessibilityStore } from '../../store/accessibility-store';

export function AccessibilityWrapper({ children }: { children: React.ReactNode }) {
  const { fontScale, highContrast, colorBlindMode } = useAccessibilityStore();
  const { width, height } = useWindowDimensions();
  const { setColorScheme } = useColorScheme();

  // Ativa/desativa as variáveis CSS do modo Alto Contraste (.dark) de forma nativa
  useEffect(() => {
    setColorScheme(highContrast ? 'dark' : 'light');
  }, [highContrast, setColorScheme]);

  const overlayTint = {
    NONE: null,
    PROTANOPIA: 'rgba(0, 114, 178, 0.15)',
    DEUTERANOPIA: 'rgba(230, 159, 0, 0.15)',
    TRITANOPIA: 'rgba(204, 121, 167, 0.15)',
    MONOCHROME: 'rgba(0, 0, 0, 0.45)',
  };

  return (
    <View style={{ flex: 1, backgroundColor: highContrast ? '#000000' : '#f6f6f6' }}>
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
            borderWidth: highContrast ? 4 : 0,
            borderColor: '#ffb400',
          }}
        />
      )}
    </View>
  );
}