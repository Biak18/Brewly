// src/features/menu/components/SearchBar.tsx
import { useTheme } from "@/theme";
import { Search, X } from "lucide-react-native";
import { Pressable, TextInput, View } from "react-native";

export function SearchBar({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (t: string) => void;
}) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        height: 44,
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderWidth: 1,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
      }}
    >
      <Search size={16} color={colors.muted} strokeWidth={1.8} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search coffee"
        placeholderTextColor={colors.muted}
        style={{
          flex: 1,
          marginLeft: spacing.sm,
          color: colors.ink,
          fontSize: 14,
        }}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={8}
          accessibilityLabel="Clear search"
        >
          <X size={16} color={colors.muted} strokeWidth={1.8} />
        </Pressable>
      )}
    </View>
  );
}
