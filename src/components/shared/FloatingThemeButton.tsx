import React, { useRef } from 'react';
import {
  TouchableOpacity,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { useAccessibilityStore } from '../../store/accessibility-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function FloatingThemeButton() {
  const { darkMode, highContrast, toggleDarkMode } = useAccessibilityStore();
  const isDark = darkMode || highContrast;

  const pan = useRef(
    new Animated.ValueXY({ x: SCREEN_WIDTH - 68, y: SCREEN_HEIGHT * 0.55 })
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
        onPress={toggleDarkMode}
        className={`w-14 h-14 rounded-full items-center justify-center shadow-lg border-2 ${
          isDark
            ? 'bg-gray-900 border-amber-400'
            : 'bg-white border-gray-300'
        }`}
      >
        {isDark ? (
          <Sun size={24} color="#ffb400" />
        ) : (
          <Moon size={24} color="#111827" />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}