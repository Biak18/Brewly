// src/stores/languageStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as Localization from "expo-localization";
import i18n, { type LanguageCode } from "@/i18n";

function deviceLanguage(): LanguageCode {
  const locales = Localization.getLocales?.() ?? [];
  const code = locales[0]?.languageCode;
  return code === "my" ? "my" : "en";
}

interface LanguageState {
  language: LanguageCode;
  setLanguage: (lng: LanguageCode) => void;
  initLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: deviceLanguage(),
      setLanguage: (lng) => {
        i18n.changeLanguage(lng);
        set({ language: lng });
      },
      initLanguage: () => {
        i18n.changeLanguage(get().language);
      },
    }),
    {
      name: "brewly-language",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.initLanguage();
      },
    },
  ),
);
