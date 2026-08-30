// src/i18n/index.ts
import * as i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import my from "./locales/my.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "my", label: "မြန်မာ" },
] as const;

export type LanguageCode =
  (typeof SUPPORTED_LANGUAGES)[number]["code"];

i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    my: { translation: my },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18next;
