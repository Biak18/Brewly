// src/theme/shadows.ts
export type ShadowTokens = { small: string; large: string };

export const lightShadows: ShadowTokens = {
  small: "0 8px 22px rgba(54,35,24,0.08)",
  large: "0 24px 60px rgba(54,35,24,0.14)",
};

export const darkShadows: ShadowTokens = {
  small: "0 8px 22px rgba(0,0,0,0.2)",
  large: "0 24px 60px rgba(0,0,0,0.35)",
};
