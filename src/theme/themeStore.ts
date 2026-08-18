// src/theme/themeStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { darkColors, lightColors, ThemeColors } from "./colors";
import { radius } from "./radius";
import { darkShadows, lightShadows, ShadowTokens } from "./shadows";
import { spacing } from "./spacing";
import { typography } from "./typography";

export type ThemeMode = "system" | "light" | "dark";

type ThemeState = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  shadows: ShadowTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  hasHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
};

function resolveIsDark(mode: ThemeMode) {
  return mode === "system"
    ? Appearance.getColorScheme() === "dark"
    : mode === "dark";
}

function slice(isDark: boolean) {
  return {
    isDark,
    colors: isDark ? darkColors : lightColors,
    shadows: isDark ? darkShadows : lightShadows,
  };
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "system",
      ...slice(resolveIsDark("system")),
      spacing,
      radius,
      typography,
      hasHydrated: false,
      setMode: (mode) => set({ mode, ...slice(resolveIsDark(mode)) }),
    }),
    {
      name: "brewly-theme",
      storage: createJSONStorage(() => AsyncStorage),
      // Persist only the user's explicit choice. colors/shadows are derived,
      // not source-of-truth — recomputing on load means a previous app
      // version's color object can never ship stale.
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          useThemeStore.setState({
            ...slice(resolveIsDark(state.mode)),
            hasHydrated: true,
          });
        }
      },
    },
  ),
);

// Live OS theme changes only matter while mode is 'system' — an explicit
// light/dark choice should never get silently overridden by the OS.
Appearance.addChangeListener(({ colorScheme }) => {
  const { mode } = useThemeStore.getState();
  if (mode === "system") useThemeStore.setState(slice(colorScheme === "dark"));
});

// Back-compat shim — every existing call site keeps working unchanged.
// New components should prefer useThemeStore(selector) for field-level subscriptions.
export function useTheme() {
  return useThemeStore();
}
