import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  showToast: (message: string, kind?: ToastKind) => void;
  dismissToast: (id: number) => void;
}

const TOAST_DURATION_MS = 4000;
let nextId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, kind = 'info') => {
    const id = ++nextId;
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, TOAST_DURATION_MS);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Convenience for calling outside React components (event handlers, utils)
export function showToast(message: string, kind: ToastKind = 'info') {
  useToastStore.getState().showToast(message, kind);
}
