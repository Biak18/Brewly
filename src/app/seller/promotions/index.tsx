// src/app/seller/promotions/index.tsx
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Pulse } from "@/components/ui/Pulse";
import { PromotionCard } from "@/features/seller/components/PromotionCard";
import {
  useMyPromotions,
  useTogglePromotionActive,
} from "@/features/seller/hooks/useMyPromotions";
import { Promotion } from "@/services/promotions";
import { fetchMyStore } from "@/services/stores";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronLeft, Plus, Tag } from "lucide-react-native";
import { useCallback } from "react";
import { Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function ManagePromotionsScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.session?.user.id);

  const { data: myStore } = useQuery({
    queryKey: ["my-store", userId],
    queryFn: () => fetchMyStore(userId!),
    enabled: !!userId,
  });
  const { data: promotions = [], isLoading } = useMyPromotions(myStore?.id);
  const toggleActive = useTogglePromotionActive(myStore?.id);

  const handlePress = useCallback(
    (p: Promotion) => router.push(`/seller/promotions/form?id=${p.id}`),
    [router],
  );
  const handleToggleActive = useCallback(
    (id: number, next: boolean) => toggleActive.mutate({ id, next }),
    [toggleActive],
  );

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
        <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
          <ChevronLeft size={20} color={colors.ink} strokeWidth={2} />
        </IconButton>
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.subheading,
            fontWeight: "800",
            marginLeft: spacing.md,
            flex: 1,
          }}
        >
          Manage Promotions
        </Text>
        <IconButton
          accessibilityLabel="Add promotion"
          variant="filled"
          onPress={() => router.push("/seller/promotions/form")}
        >
          <Plus size={18} color={colors.espresso} strokeWidth={2} />
        </IconButton>
      </View>

      {isLoading ? (
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Pulse key={i} style={{ height: 88 }} />
          ))}
        </View>
      ) : promotions.length === 0 ? (
        <EmptyState
          icon={<Tag size={28} color={colors.espresso} strokeWidth={1.8} />}
          title="No promotions yet"
          description="Run a discount on your menu to attract customers."
          actionLabel="Add promotion"
          onAction={() => router.push("/seller/promotions/form")}
        />
      ) : (
        <FlashList
          data={promotions}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ padding: spacing.lg }}
          renderItem={({ item }) => (
            <PromotionCard
              promotion={item}
              onPress={handlePress}
              onToggleActive={handleToggleActive}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
