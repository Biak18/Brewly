// src/features/checkout/components/PickupTimeRow.tsx
import { Chip } from "@/components/ui/Chip";
import { useTheme } from "@/theme";
import { View } from "react-native";

const PRESETS = [
  { value: "asap", label: "ASAP" },
  { value: "15", label: "In 15 min" },
  { value: "30", label: "In 30 min" },
  { value: "60", label: "In 1 hour" },
] as const;
export type PickupTimeValue = (typeof PRESETS)[number]["value"];

export function PickupTimeRow({
  value,
  onChange,
}: {
  value: PickupTimeValue;
  onChange: (v: PickupTimeValue) => void;
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
      {PRESETS.map((p) => (
        <Chip
          key={p.value}
          label={p.label}
          active={value === p.value}
          onPress={() => onChange(p.value)}
        />
      ))}
    </View>
  );
}
