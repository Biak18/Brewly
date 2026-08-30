// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // jest.setup.js only runs under Jest, where `jest` is a global.
    files: ["jest.setup.js"],
    languageOptions: { globals: { jest: "readonly" } },
  },
  {
    // Reanimated shared values are intentionally mutable refs — writing
    // `.value` is the library's documented API, which the compiler-based
    // react-hooks/immutability rule cannot model. These files only mutate
    // shared values for press/gesture animations.
    files: [
      "src/components/ui/Button.tsx",
      "src/components/ui/IconButton.tsx",
      "src/components/coffee/AddToCartButton.tsx",
      "src/components/coffee/CoffeeCard.tsx",
      "src/features/coffee/components/CoffeeHero.tsx",
      "src/features/orders/components/OrderCard.tsx",
      "src/features/shops/components/ShopCard.tsx",
      "src/app/seller/menu/index.tsx",
    ],
    rules: { "react-hooks/immutability": "off" },
  },
  {
    // React Compiler is enabled, so it owns memoization correctness and
    // `react-hooks/exhaustive-deps` is both redundant and conflicting with
    // `react-hooks/preserve-manual-memoization`. Disable it project-wide.
    rules: { "react-hooks/exhaustive-deps": "off" },
  },
]);
