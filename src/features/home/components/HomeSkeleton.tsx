// src/features/home/components/HomeSkeleton.tsx
import { Pulse } from "@/components/ui/Pulse";
import { useTheme } from "@/theme";
import { View } from "react-native";

export function HomeSkeleton() {
  const { spacing } = useTheme();
  return (
    <View style={{ paddingTop: spacing.lg }}>
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
        {[0, 1, 2].map((i) => (
          <Pulse key={i} style={{ height: 90, width: 140, borderRadius: 18 }} />
        ))}
      </View>
    </View>
  );
}
