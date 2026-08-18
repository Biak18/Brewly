// src/stores/toastStore.ts
import { create } from "zustand";

type ToastState = {
  message: string | null;
  actionLabel?: string;
  onAction?: () => void;
  show: (
    message: string,
    options?: { actionLabel?: string; onAction?: () => void },
  ) => void;
  hide: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message, options) =>
    set({
      message,
      actionLabel: options?.actionLabel,
      onAction: options?.onAction,
    }),
  hide: () =>
    set({ message: null, actionLabel: undefined, onAction: undefined }),
}));
