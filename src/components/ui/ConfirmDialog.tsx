// src/components/ui/ConfirmDialog.tsx
import { useConfirmDialogStore } from "@/stores/confirmDialogStore";
import { useTheme } from "@/theme";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Button } from "./Button";

export function ConfirmDialogHost() {
  const { colors, radius, spacing, typography } = useTheme();
  const options = useConfirmDialogStore((s) => s.options);
  const hide = useConfirmDialogStore((s) => s.hide);
  const [mounted, setMounted] = useState(false);
  const [wasOpen, setWasOpen] = useState(false);
  const isOpen = !!options;
  // Render-phase adjustment (see react.dev "Adjusting state when props change"):
  // mounts content as soon as the dialog opens, no setState-in-effect needed.
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setMounted(true);
  }

  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.92);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    if (options) {
      backdropOpacity.value = withTiming(1, { duration: 180 });
      cardScale.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
      cardOpacity.value = withTiming(1, { duration: 180 });
    } else if (mounted) {
      backdropOpacity.value = withTiming(0, { duration: 150 });
      cardOpacity.value = withTiming(0, { duration: 150 });
      cardScale.value = withTiming(0.96, { duration: 150 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
     
  }, [options]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  if (!mounted) return null;

  const handleCancel = () => hide();
  const handleConfirm = () => {
    options?.onConfirm();
    hide();
  };

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0,0,0,0.45)" },
          backdropStyle,
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleCancel}
          accessibilityLabel="Dismiss"
        />
      </Animated.View>
      <View style={styles.centerWrap} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderRadius: radius.xl },
            cardStyle,
          ]}
        >
          <Text
            style={{
              color: colors.ink,
              fontSize: typography.subheading,
              fontWeight: "800",
              marginBottom: spacing.sm,
            }}
          >
            {options?.title}
          </Text>
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.bodySmall,
              lineHeight: 20,
              marginBottom: spacing.xl,
            }}
          >
            {options?.message}
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button
                label={options?.cancelLabel ?? "Cancel"}
                onPress={handleCancel}
                variant="soft"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={options?.confirmLabel ?? "Confirm"}
                onPress={handleConfirm}
                variant={options?.destructive ? "danger" : "primary"}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: { width: "100%", maxWidth: 360, padding: 24 },
});
