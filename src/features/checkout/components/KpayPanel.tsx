// src/features/checkout/components/KpayPanel.tsx
import { useTheme } from "@/theme";
import { Copy, Smartphone } from "lucide-react-native";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import type { Store } from "@/services/stores";
import type { PaymentMethod } from "@/services/orders";

type KpayPanelProps = {
  store: Store | undefined;
  method: Exclude<PaymentMethod, "cash">;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
};

export function KpayPanel({
  store,
  method,
  value,
  onChangeText,
  error,
}: KpayPanelProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const phone = store?.kpay_phone;

  return (
    <View style={{ gap: spacing.sm }}>
      <View
        style={{
          padding: spacing.md,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.surface,
          gap: spacing.xs,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Smartphone size={16} color={colors.muted} strokeWidth={1.8} />
          <Text
            style={{
              marginLeft: spacing.sm,
              color: colors.muted,
              fontSize: typography.caption,
              fontWeight: "600",
            }}
          >
            {method === "kpay"
              ? "Transfer to this KBZPay number:"
              : "Pay to this MMQR / wallet number:"}
          </Text>
        </View>

        {phone ? (
          <Pressable
            onPress={async () => {
              await Clipboard.setStringAsync(phone);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 4,
            }}
          >
            <Text
              selectable
              style={{
                color: colors.ink,
                fontSize: typography.body,
                fontWeight: "800",
                letterSpacing: 0.5,
              }}
            >
              {phone}
            </Text>
            <Copy size={16} color={colors.espresso} strokeWidth={1.8} />
          </Pressable>
        ) : (
          <Text style={{ color: colors.danger, fontSize: typography.caption }}>
            This shop hasn&apos;t set a payment number yet.
          </Text>
        )}

        {!!store?.payment_note && (
          <Text
            style={{ color: colors.muted, fontSize: typography.micro }}
            selectable
          >
            {store.payment_note}
          </Text>
        )}
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Paste KBZPay transaction ID"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.line,
          height: 48,
          paddingHorizontal: 14,
          fontSize: 14,
          color: colors.ink,
          borderRadius: radius.md,
        }}
      />
      <Text style={{ color: colors.muted, fontSize: typography.micro }}>
        {Platform.select({
          ios: "You'll find the TRX ID in your KBZPay receipt.",
          default: "You'll find the TRX ID in your KBZPay receipt.",
        })}
      </Text>
      {!!error && (
        <Text style={{ color: colors.danger, fontSize: typography.micro }}>
          {error}
        </Text>
      )}
    </View>
  );
}
