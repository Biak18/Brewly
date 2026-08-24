// src/features/checkout/components/PaymentMethodRow.tsx
import { useTheme } from "@/theme";
import { Banknote, Check, QrCode, Smartphone } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

const METHODS = [
  { value: "cash", label: "Cash on pickup", icon: Banknote },
  { value: "kpay", label: "KPay transfer", icon: Smartphone },
  { value: "mmqr", label: "MMQR / scan to pay", icon: QrCode },
] as const;
export type PaymentMethodValue = (typeof METHODS)[number]["value"];

export function PaymentMethodRow({
  value,
  onChange,
}: {
  value: PaymentMethodValue;
  onChange: (v: PaymentMethodValue) => void;
}) {
  const { colors, radius, spacing, typography } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {METHODS.map((m) => {
        const active = value === m.value;
        const Icon = m.icon;
        return (
          <Pressable
            key={m.value}
            onPress={() => onChange(m.value)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: spacing.md,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: active ? colors.espresso : colors.line,
              backgroundColor: colors.surface,
            }}
          >
            <Icon size={18} color={colors.muted} strokeWidth={1.8} />
            <Text
              style={{
                flex: 1,
                marginLeft: spacing.sm,
                color: colors.ink,
                fontWeight: "800",
                fontSize: typography.bodySmall,
              }}
            >
              {m.label}
            </Text>
            {active && (
              <Check size={18} color={colors.espresso} strokeWidth={2} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
