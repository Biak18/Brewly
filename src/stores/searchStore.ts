// src/stores/searchStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const MAX_RECENT = 6;

type SearchState = {
  recent: string[];
  hasHydrated: boolean;
  addRecent: (term: string) => void;
  removeRecent: (term: string) => void;
  clearRecent: () => void;
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      recent: [],
      hasHydrated: false,
      addRecent: (term) =>
        set((state) => {
          const t = term.trim();
          if (t.length < 2) return state;
          return {
            recent: [t, ...state.recent.filter((r) => r !== t)].slice(
              0,
              MAX_RECENT,
            ),
          };
        }),
      removeRecent: (term) =>
        set((state) => ({ recent: state.recent.filter((r) => r !== term) })),
      clearRecent: () => set({ recent: [] }),
    }),
    {
      name: "brewly-search",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ recent: state.recent }),
      onRehydrateStorage: () => (state) => {
        if (state) useSearchStore.setState({ hasHydrated: true });
      },
    },
  ),
);
