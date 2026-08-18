// src/features/coffee/components/CoffeeDetailSkeleton.tsx
import { Pulse } from "@/components/ui/Pulse";
import { useTheme } from "@/theme";
import { View } from "react-native";

export function CoffeeDetailSkeleton() {
  const { spacing } = useTheme();
  return (
    <View>
      <Pulse style={{ height: 340 }} />
      <View style={{ padding: spacing.xl }}>
        <Pulse style={{ height: 24, width: 160, marginBottom: spacing.sm }} />
        <Pulse style={{ height: 14, width: "80%", marginBottom: spacing.xl }} />
        <Pulse style={{ height: 60, marginBottom: spacing.lg }} />
        <Pulse style={{ height: 60 }} />
      </View>
    </View>
  );
}
