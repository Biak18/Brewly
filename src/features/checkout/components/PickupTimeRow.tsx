// src/features/checkout/components/PickupTimeRow.tsx
import { Chip } from "@/components/ui/Chip";
import { useTheme } from "@/theme";
import {
  formatMinutes,
  parseStoreHours,
} from "@/utils/storeHours";
import { useEffect } from "react";
import { Text, View } from "react-native";

const PRESETS = [
  { value: "asap", label: "ASAP" },
  { value: "15", label: "In 15 min" },
  { value: "30", label: "In 30 min" },
  { value: "60", label: "In 1 hour" },
] as const;
export type PickupTimeValue = (typeof PRESETS)[number]["value"];

// Even "ASAP" needs prep time before an order is realistically ready.
function slotLeadMinutes(v: PickupTimeValue): number {
  return v === "asap" ? 15 : Number(v);
}

export function PickupTimeRow({
  value,
  onChange,
  hours,
}: {
  value: PickupTimeValue;
  onChange: (v: PickupTimeValue) => void;
  /** Store hours JSON ({open:"HH:MM", close:"HH:MM"}); unknown/missing hours never disable slots. */
  hours?: unknown;
}) {
  const { colors, spacing, typography } = useTheme();
  const parsed = parseStoreHours(hours);

  const isAvailable = (preset: (typeof PRESETS)[number]) => {
    if (!parsed) return true;
    const readyAt =
      new Date().getHours() * 60 +
      new Date().getMinutes() +
      slotLeadMinutes(preset.value);
    // A close time earlier than the open time wraps past midnight.
    const overnight = parsed.close < parsed.open;
    if (overnight) return readyAt >= parsed.open || readyAt < parsed.close;
    return readyAt >= parsed.open && readyAt < parsed.close;
  };

  // If the selected slot fell out of the shop's window while sitting on this
  // screen (or on remount), fall back to the first still-valid one.
  useEffect(() => {
    if (!parsed) return;
    const selected = PRESETS.find((p) => p.value === value);
    if (!selected || isAvailable(selected)) return;
    const fallback = PRESETS.find(isAvailable);
    if (fallback) onChange(fallback.value);
  });

  const someUnavailable = !!parsed && PRESETS.some((p) => !isAvailable(p));

  return (
    <View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {PRESETS.map((p) => (
          <Chip
            key={p.value}
            label={p.label}
            active={value === p.value}
            disabled={!isAvailable(p)}
            onPress={() => onChange(p.value)}
          />
        ))}
      </View>
      {someUnavailable && (
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.micro,
            marginTop: spacing.sm,
          }}
        >
          Pickup times follow the shop&apos;s hours ({formatMinutes(parsed!.open)}
          {" – "}
          {formatMinutes(parsed!.close)}).
        </Text>
      )}
    </View>
  );
}
