// src/components/ui/OfflineBanner.tsx
import { useNetworkStore } from "@/stores/networkStore";
import { useTheme } from "@/theme";
import { WifiOff } from "lucide-react-native";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function OfflineBanner() {
  const { colors, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const isOnline = useNetworkStore((s) => s.isOnline);
  const translateY = useSharedValue((insets.top + 60) * -1);

  useEffect(() => {
    translateY.value = withTiming(isOnline ? (insets.top + 60) * -1 : 0, {
      duration: 250,
    });
  }, [isOnline, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: insets.top,
          left: 0,
          right: 0,
          zIndex: 50,
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.danger,
          paddingVertical: spacing.sm,
        }}
      >
        <WifiOff size={14} color="#fff" strokeWidth={2} />
        <Text
          style={{
            color: "#fff",
            fontSize: typography.caption,
            fontWeight: "800",
            marginLeft: 6,
          }}
        >
          You're offline
        </Text>
      </View>
    </Animated.View>
  );
}
