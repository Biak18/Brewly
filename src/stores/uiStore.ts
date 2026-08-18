// src/stores/uiStore.ts
import { create } from "zustand";

type UIState = {
  isCartPreviewOpen: boolean;
  openCartPreview: () => void;
  closeCartPreview: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  isCartPreviewOpen: false,
  openCartPreview: () => set({ isCartPreviewOpen: true }),
  closeCartPreview: () => set({ isCartPreviewOpen: false }),
}));
