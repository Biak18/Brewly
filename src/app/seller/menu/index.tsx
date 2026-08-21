// src/app/seller/menu/index.tsx
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Pulse } from "@/components/ui/Pulse";
import { SellerCoffeeCard } from "@/features/seller/components/SellerCoffeeCard";
import {
  useMyStoreCoffees,
  useToggleCoffeeActive,
} from "@/features/seller/hooks/useMyStoreCoffees";
import { fetchMyStore } from "@/services/stores";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme";
import { FlashList } from "@shopify/flash-list";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronLeft, Coffee as CoffeeIcon, Plus } from "lucide-react-native";
import { useCallback } from "react";
import { Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function ManageMenuScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();

  const { data: myStore } = useQuery({
    queryKey: ["my-store", userId],
    queryFn: () => fetchMyStore(userId!),
    enabled: !!userId,
  });

  const { data: coffees = [], isLoading } = useMyStoreCoffees(myStore?.id);
  const toggleActive = useToggleCoffeeActive(myStore?.id);

  const handlePress = useCallback(
    (id: string) => router.push(`/seller/menu/coffee-form?id=${id}`),
    [router],
  );

  const handleToggleActive = useCallback(
    (id: string, next: boolean) => toggleActive.mutate({ id, next }),
    [toggleActive],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
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
          Manage Menu
        </Text>
        <IconButton
          accessibilityLabel="Add coffee"
          variant="filled"
          onPress={() => router.push("/seller/menu/coffee-form")}
        >
          <Plus size={18} color={colors.espresso} strokeWidth={2} />
        </IconButton>
      </View>

      {isLoading ? (
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Pulse key={i} style={{ height: 76 }} />
          ))}
        </View>
      ) : coffees.length === 0 ? (
        <EmptyState
          icon={
            <CoffeeIcon size={28} color={colors.espresso} strokeWidth={1.8} />
          }
          title="No coffees yet"
          description="Add your first item to start selling."
          actionLabel="Add coffee"
          onAction={() => router.push("/seller/menu/coffee-form")}
        />
      ) : (
        <FlashList
          data={coffees}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: spacing.lg }}
          renderItem={({ item }) => (
            <SellerCoffeeCard
              coffee={item}
              onPress={handlePress}
              onToggleActive={handleToggleActive}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
