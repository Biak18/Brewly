// src/components/ui/EmptyState.tsx
import { useTheme } from "@/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  const { colors, radius, spacing, typography } = useTheme();
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.mark,
          { backgroundColor: colors.cream, borderRadius: radius.xl },
        ]}
      >
        {icon}
      </View>
      <Text
        style={[
          styles.title,
          { color: colors.muted, fontSize: typography.subheading },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.description,
          {
            color: colors.muted,
            marginTop: spacing.sm,
            marginBottom: spacing.xl,
          },
        ]}
        selectable
      >
        {description}
      </Text>
      {(actionLabel && onAction) ||
      (secondaryActionLabel && onSecondaryAction) ? (
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {actionLabel && onAction && (
            <View style={{ flex: 1 }}>
              <Button label={actionLabel} onPress={onAction} variant="primary" />
            </View>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <View style={{ flex: 1 }}>
              <Button
                label={secondaryActionLabel}
                onPress={onSecondaryAction}
                variant="soft"
              />
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  mark: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },
  title: { fontWeight: "800", letterSpacing: -0.4 },
  description: {
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    maxWidth: 220,
  },
});
