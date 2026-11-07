import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastState {
  visible: boolean;
  type: ToastType;
  title: string;
  message?: string;
  showToast: (params: { type: ToastType; title: string; message?: string }) => void;
  hideToast: () => void;
}

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  type: 'success',
  title: '',
  message: '',

  showToast: ({ type, title, message }) => {
    if (toastTimeout) clearTimeout(toastTimeout);
    set({ visible: true, type, title, message });

    toastTimeout = setTimeout(() => {
      set({ visible: false });
    }, 3800);
  },

  hideToast: () => {
    if (toastTimeout) clearTimeout(toastTimeout);
    set({ visible: false });
  },
}));