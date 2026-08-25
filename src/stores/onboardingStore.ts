// src/stores/onboardingStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type OnboardingState = {
  hasOnboarded: boolean;
  hasHydrated: boolean;
  completeOnboarding: () => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      hasHydrated: false,
      completeOnboarding: () => set({ hasOnboarded: true }),
    }),
    {
      name: "brewly-onboarding",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ hasOnboarded: state.hasOnboarded }),
      onRehydrateStorage: () => (state) => {
        if (state) useOnboardingStore.setState({ hasHydrated: true });
      },
    },
  ),
);
