// src/features/search/components/SearchIdlePanel.tsx
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchStores } from "@/services/stores";
import { useSearchStore } from "@/stores/searchStore";
import { useTheme } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import { Coffee as CoffeeIcon, Clock } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

function SectionHeader({
  icon,
  title,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors, typography } = useTheme();
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
    >
      {icon}
      <Text
        style={{
          color: colors.muted,
          fontSize: typography.caption,
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: 1,
          flex: 1,
          marginLeft: 6,
        }}
      >
        {title}
      </Text>
      {actionLabel && (
        <Pressable hitSlop={8} onPress={onAction}>
          <Text
            style={{
              color: colors.espresso2,
              fontSize: typography.caption,
              fontWeight: "700",
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function SearchIdlePanel({
  onPickTerm,
  onPickStore,
}: {
  onPickTerm: (term: string) => void;
  onPickStore: (storeId: string) => void;
}) {
  const { colors, spacing, radius, typography } = useTheme();
  const recent = useSearchStore((s) => s.recent);
  const clearRecent = useSearchStore((s) => s.clearRecent);
  const removeRecent = useSearchStore((s) => s.removeRecent);
  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: fetchStores,
    staleTime: 60_000,
  });

  const handleRemove = useCallback(
    (term: string) => {
      removeRecent(term);
      if (recent.length <= 1) clearRecent();
    },
    [removeRecent, clearRecent, recent.length],
  );

  if (recent.length === 0)
    return (
      <View style={{ padding: spacing.xl, paddingTop: spacing.xxxl }}>
        <EmptyState
          icon={
            <CoffeeIcon size={28} color={colors.espresso} strokeWidth={1.8} />
          }
          title="Search Brewly"
          description={'Find drinks or shops by name. Try "latte".'}
        />
      </View>
    );

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: spacing.xxxl,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <SectionHeader
        icon={<Clock size={13} color={colors.muted} strokeWidth={2} />}
        title="Recent searches"
        actionLabel="Clear all"
        onAction={clearRecent}
      />
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.sm,
          marginBottom: spacing.xxl,
        }}
      >
        {recent.map((term) => (
          <View key={term} style={{ flexDirection: "row", gap: spacing.sm }}>
            <Chip label={term} active={false} onPress={() => onPickTerm(term)} />
            <Pressable
              accessibilityLabel={`Remove ${term}`}
              hitSlop={8}
              onPress={() => handleRemove(term)}
              style={{ justifyContent: "center", paddingRight: spacing.xs }}
            >
              <Text style={{ color: colors.muted, fontSize: 12 }}>✕</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {stores.length > 0 && (
        <>
          <SectionHeader
            icon={
              <CoffeeIcon size={13} color={colors.muted} strokeWidth={2} />
            }
            title="Browse shops"
          />
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: spacing.sm,
            }}
          >
            {stores.slice(0, 6).map((s) => (
              <Chip
                key={s.id}
                label={s.name}
                active={false}
                onPress={() => onPickStore(s.id)}
              />
            ))}
          </View>
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.micro,
              marginTop: spacing.lg,
              textAlign: "center",
              borderRadius: radius.md,
            }}
          >
            Tap a shop to see its menu.
          </Text>
        </>
      )}
    </ScrollView>
  );
}
