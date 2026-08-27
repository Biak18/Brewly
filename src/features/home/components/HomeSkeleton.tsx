// src/features/home/components/HomeSkeleton.tsx
import { Pulse } from "@/components/ui/Pulse";
import { useTheme } from "@/theme";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function HomeSkeleton() {
  const { spacing } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1 }}>
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
    </SafeAreaView>
  );
}
