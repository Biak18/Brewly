// src/theme/typography.ts
export const typography = {
  display: 30,
  title: 28,
  heading: 22,
  subheading: 18,
  body: 14,
  bodySmall: 12,
  caption: 11,
  micro: 10,
  eyebrow: {
    size: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
    fontWeight: "800" as const,
  },
} as const;
