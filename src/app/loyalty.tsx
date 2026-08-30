// src/app/loyalty.tsx
import { IconButton } from "@/components/ui/IconButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { LOYALTY_REWARD_AT, fetchMyLoyaltyCards } from "@/services/loyalty";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronLeft, Coffee, Gift, Stamp } from "lucide-react-native";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

function StampDots({ filled }: { filled: number }) {
  const { colors } = useTheme();
  const total = LOYALTY_REWARD_AT;
  return (
    <View style={{ flexDirection: "row", gap: 6, marginTop: 10 }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              i < Math.min(filled, total) ? colors.cream : colors.surface2,
            borderWidth: i === total - 1 && filled >= total ? 2 : 0,
            borderColor: colors.green,
          }}
        >
          {i < filled && <Coffee size={12} color={colors.espresso} />}
        </View>
      ))}
    </View>
  );
}

export default function LoyaltyScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["loyalty", userId],
    queryFn: fetchMyLoyaltyCards,
    enabled: !!userId,
  });

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: spacing.sm,
        backgroundColor: colors.bg,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
        }}
      >
        <IconButton accessibilityLabel={t("common.back")} onPress={() => router.back()}>
          <ChevronLeft size={20} color={colors.ink} strokeWidth={2} />
        </IconButton>
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.subheading,
            fontWeight: "800",
            marginLeft: spacing.md,
          }}
        >
          {t("loyalty.title")}
        </Text>
      </View>

      {isLoading ? null : cards.length === 0 ? (
        <EmptyState
          icon={<Stamp size={28} color={colors.espresso} strokeWidth={1.8} />}
          title={t("loyalty.emptyTitle")}
          description={t("loyalty.emptyDescription")}
        />
      ) : (
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          {cards.map((card) => {
            const ready = card.stamps >= LOYALTY_REWARD_AT;
            const remaining = LOYALTY_REWARD_AT - card.stamps;
            return (
              <View
                key={card.store_id}
                style={{
                  padding: spacing.lg,
                  borderRadius: radius.xl,
                  borderWidth: 1,
                  borderColor: ready ? colors.green : colors.line,
                  backgroundColor: colors.surface,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: colors.ink,
                      fontSize: typography.body,
                      fontWeight: "800",
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {card.store_name}
                  </Text>
                  {ready ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: colors.greenSoft,
                        borderRadius: radius.pill,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      <Gift size={13} color={colors.green} strokeWidth={2} />
                      <Text
                        style={{
                          color: colors.green,
                          fontSize: typography.micro,
                          fontWeight: "800",
                          marginLeft: 4,
                        }}
                      >
                        {t("loyalty.freeCoffeeReady")}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={{
                        color: colors.muted,
                        fontSize: typography.caption,
                        fontWeight: "600",
                      }}
                    >
                      {card.stamps}/{LOYALTY_REWARD_AT}
                    </Text>
                  )}
                </View>

                <StampDots filled={card.stamps} />

                {!ready && (
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: typography.micro,
                      marginTop: 8,
                    }}
                  >
                    {t("loyalty.remaining", { count: remaining })}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
}
