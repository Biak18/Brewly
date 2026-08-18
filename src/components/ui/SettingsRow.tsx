// src/components/ui/SettingsRow.tsx
import { useTheme } from "@/theme";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

type SettingsRowProps = {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
};

export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  disabled,
}: SettingsRowProps) {
  const { colors, spacing, typography } = useTheme();
  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.md,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon}
      <Text
        style={{
          flex: 1,
          marginLeft: icon ? spacing.sm : 0,
          color: colors.ink,
          fontSize: typography.bodySmall,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
      {value && (
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.caption,
            marginRight: onPress && !disabled ? spacing.xs : 0,
          }}
        >
          {value}
        </Text>
      )}
      {onPress && !disabled && (
        <ChevronRight size={16} color={colors.muted} strokeWidth={1.8} />
      )}
    </View>
  );
  return onPress && !disabled ? (
    <Pressable onPress={onPress}>{content}</Pressable>
  ) : (
    content
  );
}
