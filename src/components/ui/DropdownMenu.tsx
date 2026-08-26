// src/components/ui/DropdownMenu.tsx
import { useTheme } from "@/theme";
import { Check } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export type DropdownMenuOption<T extends string> = { value: T; label: string };

type DropdownMenuProps<T extends string> = {
  visible: boolean;
  onClose: () => void;
  options: DropdownMenuOption<T>[];
  value: T;
  onChange: (value: T) => void;
  anchorTop: number; // approximate position below the trigger button, not a measured ref
};

// Same Modal + backdrop-dismiss + Reanimated-scale pattern as ConfirmDialog —
// this is genuinely just a smaller, anchored variant of it, not a new pattern.
export function DropdownMenu<T extends string>({
  visible,
  onClose,
  options,
  value,
  onChange,
  anchorTop,
}: DropdownMenuProps<T>) {
  const { colors, radius, spacing, typography, shadows } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [wasVisible, setWasVisible] = useState(false);
  // Render-phase adjustment (see react.dev "Adjusting state when props change"):
  // mounts content as soon as the menu opens, no setState-in-effect needed.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setMounted(true);
  }
  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withTiming(1, {
        duration: 160,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, { duration: 120 });
    } else if (mounted) {
      scale.value = withTiming(0.92, { duration: 120 });
      opacity.value = withTiming(0, { duration: 120 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!mounted) return null;

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityLabel="Dismiss"
      />
      <Animated.View
        style={[
          {
            position: "absolute",
            top: anchorTop,
            right: spacing.xl,
            minWidth: 200,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.line,
            paddingVertical: spacing.xs,
            boxShadow: shadows.large,
          },
          style,
        ]}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => {
                onChange(opt.value);
                onClose();
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
              }}
            >
              <Text
                style={{
                  color: active ? colors.espresso : colors.ink,
                  fontWeight: active ? "800" : "500",
                  fontSize: typography.bodySmall,
                }}
              >
                {opt.label}
              </Text>
              {active && (
                <Check size={16} color={colors.espresso} strokeWidth={2} />
              )}
            </Pressable>
          );
        })}
      </Animated.View>
    </Modal>
  );
}
