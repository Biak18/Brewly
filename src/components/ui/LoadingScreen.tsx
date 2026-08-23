// src/components/ui/LoadingScreen.tsx
import { useTheme } from "@/theme";
import { Coffee } from "lucide-react-native";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export function LoadingScreen() {
  const { colors, spacing, typography } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 700, easing: Easing.inOut(Easing.cubic) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700 }),
        withTiming(0.6, { duration: 700 }),
      ),
      -1,
      true,
    );
  }, [scale, opacity]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={[
          {
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.cream,
            alignItems: "center",
            justifyContent: "center",
          },
          iconStyle,
        ]}
      >
        <Coffee size={32} color={colors.espresso} strokeWidth={1.8} />
      </Animated.View>
      <Text
        style={{
          color: colors.ink,
          fontSize: typography.subheading,
          fontWeight: "800",
          marginTop: spacing.lg,
        }}
      >
        Brewly
      </Text>
    </View>
  );
}
