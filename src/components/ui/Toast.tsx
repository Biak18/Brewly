// src/components/ui/Toast.tsx
import { useToastStore } from "@/stores/toastStore";
import { useTheme } from "@/theme";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

const AUTO_DISMISS_MS = 4000;

export function ToastHost() {
  const { colors, radius, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const message = useToastStore((s) => s.message);
  const actionLabel = useToastStore((s) => s.actionLabel);
  const onAction = useToastStore((s) => s.onAction);
  const hide = useToastStore((s) => s.hide);

  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!message) return;
    translateY.value = withSpring(0, { damping: 18 });
    opacity.value = withTiming(1, { duration: 200 });
    const timeout = setTimeout(() => {
      translateY.value = withTiming(-100, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) scheduleOnRN(hide);
      });
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(timeout);
  }, [message, translateY, opacity, hide]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: "absolute",
          top: insets.top + 45,
          left: spacing.lg,
          right: spacing.lg,
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.espresso,
          borderRadius: radius.lg,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
        }}
      >
        <Text
          style={{
            flex: 1,
            color: colors.surface,
            fontSize: typography.bodySmall,
            fontWeight: "600",
          }}
        >
          {message}
        </Text>
        {actionLabel && onAction && (
          <Pressable
            onPress={() => {
              onAction();
              hide();
            }}
            hitSlop={8}
          >
            <Text
              style={{
                color: colors.cream,
                fontSize: typography.bodySmall,
                fontWeight: "800",
                marginLeft: spacing.md,
              }}
            >
              {actionLabel}
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}
