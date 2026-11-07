import { create } from 'zustand';

export type ColorBlindMode = 'NONE' | 'PROTANOPIA' | 'DEUTERANOPIA' | 'TRITANOPIA' | 'MONOCHROME';

interface AccessibilityState {
  fontScale: 1 | 1.15 | 1.3;
  highContrast: boolean;
  colorBlindMode: ColorBlindMode;
  setFontScale: (scale: 1 | 1.15 | 1.3) => void;
  toggleHighContrast: () => void;
  setColorBlindMode: (mode: ColorBlindMode) => void;
  resetAccessibility: () => void;
}

export const useAccessibilityStore = create<AccessibilityState>((set) => ({
  fontScale: 1,
  highContrast: false,
  colorBlindMode: 'NONE',

  setFontScale: (fontScale) => set({ fontScale }),
  toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
  setColorBlindMode: (colorBlindMode) => set({ colorBlindMode }),
  resetAccessibility: () =>
    set({ fontScale: 1, highContrast: false, colorBlindMode: 'NONE' }),
}));