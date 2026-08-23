// src/stores/confirmDialogStore.ts
import { create } from "zustand";

export type ConfirmDialogOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
};

type ConfirmDialogState = {
  options: ConfirmDialogOptions | null;
  show: (options: ConfirmDialogOptions) => void;
  hide: () => void;
};

export const useConfirmDialogStore = create<ConfirmDialogState>((set) => ({
  options: null,
  show: (options) => set({ options }),
  hide: () => set({ options: null }),
}));
