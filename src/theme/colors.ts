// src/theme/colors.ts
export type ThemeColors = {
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  muted: string;
  line: string;
  espresso: string;
  espresso2: string;
  cream: string;
  green: string;
  greenSoft: string;
  danger: string;
};

export const lightColors: ThemeColors = {
  bg: "#f6efe6",
  surface: "#fffaf3",
  surface2: "#ede2d4",
  ink: "#2b211d",
  muted: "#81736a",
  line: "#dfd1c2",
  espresso: "#4a2f24",
  espresso2: "#684538",
  cream: "#ead5ba",
  green: "#5c8064",
  greenSoft: "#e2eee3",
  danger: "#ad5d5b",
};

export const darkColors: ThemeColors = {
  bg: "#211916",
  surface: "#2b211e",
  surface2: "#392a25",
  ink: "#f4eadd",
  muted: "#b3a298",
  line: "#4a3730",
  espresso: "#e8d6bf",
  espresso2: "#f1e1cc",
  cream: "#4d362c",
  green: "#8eb79a",
  greenSoft: "#2e4936",
  danger: "#e38e8a",
};
