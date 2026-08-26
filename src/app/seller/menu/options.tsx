// src/app/seller/menu/options.tsx
import { BottomSheet } from "@/components/ui/BottomSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Pulse } from "@/components/ui/Pulse";
import { OptionFormSheet } from "@/features/seller/components/OptionFormSheet";
import { OptionRow } from "@/features/seller/components/OptionRow";
import { useMyCategories } from "@/features/seller/hooks/useMyCategories";
import {
  fetchMyOptions,
  OptionType,
  SellerOption,
} from "@/services/sellerOptions";
import { fetchMyStore } from "@/services/stores";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronLeft, Plus, Sliders } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { SectionList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TYPE_LABELS: Record<OptionType, string> = {
  size: "Size",
  temperature: "Temperature",
  milk: "Milk",
  extra: "Extra",
};

export default function ManageOptionsScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user.id);

  const { data: myStore } = useQuery({
    queryKey: ["my-store", userId],
    queryFn: () => fetchMyStore(userId!),
    enabled: !!userId,
  });
  const { data: options = [], isLoading } = useQuery({
    queryKey: ["seller-options", myStore?.id],
    queryFn: () => fetchMyOptions(myStore!.id),
    enabled: !!myStore?.id,
  });
  const { data: categories = [] } = useMyCategories(myStore?.id);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<SellerOption | null>(null);

  const sections = useMemo(() => {
    const grouped: Record<OptionType, SellerOption[]> = {
      size: [],
      temperature: [],
      milk: [],
      extra: [],
    };
    options.forEach((o) => grouped[o.type].push(o));
    return (Object.keys(grouped) as OptionType[])
      .filter((t) => grouped[t].length > 0)
      .map((t) => ({ title: TYPE_LABELS[t], data: grouped[t] }));
  }, [options]);

  const openCreate = useCallback(() => {
    setEditingOption(null);
    setSheetOpen(true);
  }, []);
  const openEdit = useCallback((option: SellerOption) => {
    setEditingOption(option);
    setSheetOpen(true);
  }, []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  if (!myStore) return null;

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
          paddingBottom: spacing.md,
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
          Manage Options
        </Text>
        <IconButton
          accessibilityLabel="Add option"
          variant="filled"
          onPress={openCreate}
        >
          <Plus size={18} color={colors.espresso} strokeWidth={2} />
        </IconButton>
      </View>

      {isLoading ? (
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Pulse key={i} style={{ height: 60 }} />
          ))}
        </View>
      ) : options.length === 0 ? (
        <EmptyState
          icon={<Sliders size={28} color={colors.espresso} strokeWidth={1.8} />}
          title="No options yet"
          description="Add sizes, milk choices, and extras your customers can pick."
          actionLabel="Add option"
          onAction={openCreate}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg }}
          renderSectionHeader={({ section }) => (
            <Text
              style={{
                color: colors.muted,
                fontSize: typography.caption,
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginTop: spacing.md,
                marginBottom: spacing.sm,
              }}
            >
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <OptionRow
              option={item}
              categoryCount={categories.length}
              onPress={openEdit}
            />
          )}
        />
      )}

      <BottomSheet visible={sheetOpen} onClose={closeSheet}>
        {/* Remount per target so form state reseeds without an effect. */}
        <OptionFormSheet
          key={editingOption?.id ?? "new"}
          storeId={myStore.id}
          option={editingOption}
          onDone={closeSheet}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}
