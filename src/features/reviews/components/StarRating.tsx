// src/features/reviews/components/StarRating.tsx
import { useTheme } from "@/theme";
import { Star } from "lucide-react-native";
import { Pressable, View } from "react-native";

type StarRatingProps = {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
};

// Standout gold — theme tokens are too pale for stars on cream surfaces.
const GOLD = "#FFC107";

export function StarRating({ value, onChange, size = 28 }: StarRatingProps) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const star = (
          <Star
            size={size}
            color={filled ? GOLD : colors.line}
            fill={filled ? GOLD : "transparent"}
            strokeWidth={1.5}
          />
        );
        return onChange ? (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${n} star${n === 1 ? "" : "s"}`}
            style={{ padding: 2 }}
          >
            {star}
          </Pressable>
        ) : (
          <View key={n}>{star}</View>
        );
      })}
    </View>
  );
}
