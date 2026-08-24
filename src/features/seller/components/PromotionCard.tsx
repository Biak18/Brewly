// src/features/seller/components/PromotionCard.tsx
import { Promotion } from "@/services/promotions";
import { useTheme } from "@/theme";
import { useCallback } from "react";
import { Pressable, Switch, Text, View } from "react-native";

type PromotionCardProps = {
  promotion: Promotion;
  onPress: (p: Promotion) => void;
  onToggleActive: (id: number, next: boolean) => void;
};

export function PromotionCard({
  promotion,
  onPress,
  onToggleActive,
}: PromotionCardProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const handlePress = useCallback(
    () => onPress(promotion),
    [onPress, promotion],
  );
  const handleToggle = useCallback(
    (v: boolean) => onToggleActive(promotion.id, v),
    [onToggleActive, promotion.id],
  );

  const today = new Date().toISOString().slice(0, 10);
  const isExpired = promotion.ends_at < today;
  const isUpcoming = promotion.starts_at > today;
  const statusLabel = isExpired ? "Ended" : isUpcoming ? "Upcoming" : "Live";
  const statusColor = isExpired
    ? colors.muted
    : isUpcoming
      ? colors.espresso
      : colors.green;

  return (
    <Pressable
      onPress={handlePress}
      style={{
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderWidth: 1,
        borderRadius: radius.xl,
        marginBottom: spacing.md,
        opacity: promotion.is_active ? 1 : 0.55,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <Text
            style={{
              color: colors.ink,
              fontWeight: "800",
              fontSize: typography.bodySmall,
            }}
          >
            {promotion.title}
          </Text>
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.micro,
              marginTop: 2,
            }}
            numberOfLines={2}
          >
            {promotion.description}
          </Text>
        </View>
        <Switch
          value={promotion.is_active}
          onValueChange={handleToggle}
          trackColor={{ true: colors.green, false: colors.line }}
        />
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: spacing.sm,
        }}
      >
        <Text
          style={{
            color: statusColor,
            fontSize: typography.micro,
            fontWeight: "800",
            textTransform: "uppercase",
          }}
        >
          {statusLabel} · {promotion.discount_percent}% off
        </Text>
        <Text style={{ color: colors.muted, fontSize: typography.micro }}>
          {promotion.starts_at} – {promotion.ends_at}
        </Text>
      </View>
    </Pressable>
  );
}
