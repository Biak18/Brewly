// src/features/checkout/components/PromoCodeInput.tsx
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/theme";
import { Ticket, X } from "lucide-react-native";
import { Pressable, Text, TextInput, View } from "react-native";

export type AppliedPromo = {
  code: string;
  title: string;
  discountPercent: number;
};

export function PromoCodeInput({
  value,
  onChangeText,
  applied,
  error,
  busy,
  onApply,
  onRemove,
}: {
  value: string;
  onChangeText: (v: string) => void;
  applied: AppliedPromo | null;
  error?: string | null;
  busy?: boolean;
  onApply: () => void;
  onRemove: () => void;
}) {
  const { colors, radius, spacing, typography } = useTheme();

  if (applied) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: spacing.md,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.green,
          backgroundColor: colors.greenSoft,
          gap: spacing.sm,
        }}
      >
        <Ticket size={18} color={colors.green} strokeWidth={1.8} />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.green,
              fontWeight: "800",
              fontSize: typography.bodySmall,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {applied.code}
          </Text>
          <Text style={{ color: colors.muted, fontSize: typography.micro }}>
            {applied.title} · {applied.discountPercent}% off
          </Text>
        </View>
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          accessibilityLabel="Remove promo code"
          style={{ padding: spacing.xs }}
        >
          <X size={16} color={colors.muted} strokeWidth={2} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <TextInput
          value={value}
          onChangeText={(v) => onChangeText(v.toUpperCase())}
          placeholder="Enter promo code"
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!busy}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.line,
            height: 48,
            paddingHorizontal: 14,
            fontSize: 14,
            color: colors.ink,
            borderRadius: radius.md,
          }}
        />
        <View style={{ justifyContent: "center" }}>
          <Button
            label="Apply"
            onPress={onApply}
            variant="soft"
            loading={busy}
            disabled={value.trim().length === 0 || busy}
          />
        </View>
      </View>
      {!!error && (
        <Text style={{ color: colors.danger, fontSize: typography.micro }}>
          {error}
        </Text>
      )}
    </View>
  );
}
