// src/features/menu/components/MenuSkeleton.tsx
import { Pulse } from "@/components/ui/Pulse";
import { useTheme } from "@/theme";
import { View } from "react-native";

export function MenuSkeleton() {
  const { spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: spacing.lg,
      }}
    >
      {[0, 1, 2].flatMap((row) =>
        [0, 1].map((col) => (
          <View key={`${row}-${col}`} style={{ flex: 1, margin: spacing.xs }}>
            <Pulse style={{ height: 220 }} />
          </View>
        )),
      )}
    </View>
  );
}
