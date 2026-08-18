// src/features/home/components/HomeHeader.tsx
import { IconButton } from "@/components/ui/IconButton";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme";
import { useRouter } from "expo-router";
import { MapPin } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

export function HomeHeader() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const fullName = useAuthStore((s) => s.profile?.full_name);
  const firstName = fullName?.split(" ")[0] ?? "there";

  return (
    <View
      style={[
        styles.row,
        { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
      ]}
    >
      <View>
        <View style={styles.locationRow}>
          <MapPin size={12} color={colors.muted} strokeWidth={1.8} />
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.caption,
              marginLeft: 4,
            }}
          >
            Yangon
          </Text>
        </View>
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.heading,
            fontWeight: "800",
            marginTop: 4,
          }}
        >
          Hello, {firstName}
        </Text>
      </View>
      <IconButton
        accessibilityLabel="Open profile"
        onPress={() => router.push("/(tabs)/profile")}
      >
        <Text style={{ color: colors.espresso, fontWeight: "800" }}>
          {firstName[0]?.toUpperCase()}
        </Text>
      </IconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  locationRow: { flexDirection: "row", alignItems: "center" },
});
