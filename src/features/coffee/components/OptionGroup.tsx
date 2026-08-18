// src/features/coffee/components/OptionGroup.tsx
import { Chip } from "@/components/ui/Chip";
import { CoffeeOption } from "@/services/coffees";
import { useTheme } from "@/theme";
import { Text, View } from "react-native";

type OptionGroupProps = {
  title: string;
  options: CoffeeOption[];
  mode: "single" | "multi";
  selected: string | string[];
  onSelect: (id: string) => void;
};

export function OptionGroup({
  title,
  options,
  mode,
  selected,
  onSelect,
}: OptionGroupProps) {
  const { colors, spacing, typography } = useTheme();
  if (options.length === 0) return null;

  const isActive = (id: string) =>
    mode === "single" ? selected === id : (selected as string[]).includes(id);

  return (
    <View style={{ marginTop: spacing.xl }}>
      <Text
        style={{
          color: colors.ink,
          fontSize: typography.body,
          fontWeight: "800",
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {options.map((opt) => (
          <Chip
            key={opt.id}
            label={
              opt.price_delta > 0
                ? `${opt.label} (+$${opt.price_delta.toFixed(2)})`
                : opt.label
            }
            active={isActive(opt.id)}
            onPress={() => onSelect(opt.id)}
          />
        ))}
      </View>
    </View>
  );
}
