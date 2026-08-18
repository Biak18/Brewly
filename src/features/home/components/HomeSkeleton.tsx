// src/features/home/components/HomeSkeleton.tsx
import { Pulse } from "@/components/ui/Pulse";
import { useTheme } from "@/theme";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function HomeSkeleton() {
  const { spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: spacing.lg + insets.top }}>
      <Pulse
        style={{
          height: 40,
          marginHorizontal: spacing.xl,
          marginBottom: spacing.lg,
          width: 160,
        }}
      />
      <Pulse
        style={{
          height: 140,
          marginHorizontal: spacing.xl,
          marginBottom: spacing.xxl,
        }}
      />
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: spacing.xl,
          gap: spacing.sm,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <Pulse key={i} style={{ height: 38, width: 80, borderRadius: 999 }} />
        ))}
      </View>
    </View>
  );
}
