// src/features/checkout/components/TipJar.tsx
import { useTheme } from "@/theme";
import { HandCoins } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

const TIP_OPTIONS = [0, 0.5, 1, 2];

export function TipJar({
  value,
  onChange,
}: {
  value: number;
  onChange: (tip: number) => void;
}) {
  const { colors, radius, spacing, typography } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <HandCoins size={16} color={colors.muted} strokeWidth={1.8} />
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.caption,
            fontWeight: "600",
            flex: 1,
          }}
        >
          100% of your tip goes to the barista.
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        {TIP_OPTIONS.map((tip) => {
          const active = value === tip;
          return (
            <Pressable
              key={tip}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tip === 0 ? "No tip" : `Tip $${tip.toFixed(2)}`}
              onPress={() => onChange(tip)}
              style={{
                flex: 1,
                height: 44,
                borderRadius: radius.md,
                borderWidth: 1,
                alignItems: "center",
                justifyContent: "center",
                borderColor: active ? colors.espresso : colors.line,
                backgroundColor: active ? colors.espresso : colors.surface,
              }}
            >
              <Text
                style={{
                  color: active ? colors.surface : colors.ink,
                  fontSize: typography.bodySmall,
                  fontWeight: "800",
                }}
              >
                {tip === 0 ? "None" : `$${tip.toFixed(2)}`}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
