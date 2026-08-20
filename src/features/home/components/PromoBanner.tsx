// src/features/home/components/PromoBanner.tsx
import { Button } from "@/components/ui/Button";
import { useActivePromotions } from "@/features/promotions/hooks/useActivePromotions";
import { useTheme } from "@/theme";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";

export function PromoBanner() {
  const { colors, radius, spacing, typography } = useTheme();
  const router = useRouter();
  const { data: promotions = [] } = useActivePromotions();

  const featured =
    promotions.find((p) => p.scope === "all") ?? promotions[0] ?? null;

  return (
    <View
      style={{
        backgroundColor: colors.cream,
        borderRadius: radius.xxl,
        marginHorizontal: spacing.xl,
        padding: spacing.xl,
      }}
    >
      <Text
        style={{
          color: "#ead5ba",
          fontSize: typography.eyebrow.size,
          letterSpacing: typography.eyebrow.letterSpacing,
          textTransform: "uppercase",
          fontWeight: "800",
        }}
      >
        {featured ? "Limited time" : "Riverside Roasters"}
      </Text>
      <Text
        style={{
          color: "#fffaf3",
          fontSize: typography.subheading,
          fontWeight: "800",
          marginTop: 6,
          marginBottom: spacing.md,
          maxWidth: 220,
        }}
      >
        {featured
          ? featured.description
          : "Small-batch coffee, roasted fresh every week"}
      </Text>
      <Button
        label={featured ? "Order now" : "Browse menu"}
        onPress={() => router.push("/(tabs)/shops")}
        variant="light"
      />
    </View>
  );
}
