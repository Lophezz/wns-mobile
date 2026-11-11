import { create } from 'zustand';

export type FontScaleLevel = 1 | 1.15 | 1.3;
export type ColorBlindMode =
  | 'NONE'
  | 'PROTANOPIA'
  | 'DEUTERANOPIA'
  | 'TRITANOPIA'
  | 'MONOCHROME';

interface AccessibilityState {
  fontScale: FontScaleLevel;
  darkMode: boolean;
  highContrast: boolean;
  colorBlindMode: ColorBlindMode;
  setFontScale: (scale: FontScaleLevel) => void;
  toggleDarkMode: () => void;
  toggleHighContrast: () => void;
  setColorBlindMode: (mode: ColorBlindMode) => void;
  resetAccessibility: () => void;
}

export const useAccessibilityStore = create<AccessibilityState>((set) => ({
  fontScale: 1,
  darkMode: false,
  highContrast: false,
  colorBlindMode: 'NONE',
  setFontScale: (fontScale) => set({ fontScale }),
  toggleDarkMode: () =>
    set((s) => ({
      darkMode: !s.darkMode,
      highContrast: false, // Desativa o alto contraste ao alternar modo escuro padrão
    })),
  toggleHighContrast: () =>
    set((s) => ({
      highContrast: !s.highContrast,
      darkMode: !s.highContrast ? true : s.darkMode,
    })),
  setColorBlindMode: (colorBlindMode) => set({ colorBlindMode }),
  resetAccessibility: () =>
    set({
      fontScale: 1,
      darkMode: false,
      highContrast: false,
      colorBlindMode: 'NONE',
    }),
}));