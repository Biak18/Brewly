// src/features/seller/components/TimeField.tsx
import { useTheme } from "@/theme";
import { Clock } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

export function TimeField({
  label,
  value,
  error,
  onPress,
}: {
  label: string;
  /** "HH:MM" or empty string when unset. */
  value: string;
  error?: string;
  onPress: () => void;
}) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} ${value || "not set"}`}
        onPress={onPress}
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.line,
          height: 48,
          paddingHorizontal: 14,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
        }}
      >
        <Clock size={16} color={colors.muted} strokeWidth={1.8} />
        <Text
          style={{
            marginLeft: spacing.sm,
            fontSize: 14,
            color: value ? colors.ink : colors.muted,
            fontWeight: value ? "700" : "400",
            flex: 1,
          }}
          numberOfLines={1}
        >
          {value || label}
        </Text>
      </Pressable>
      {!!error && (
        <Text style={{ color: colors.danger, fontSize: 11, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}
