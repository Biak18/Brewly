// src/features/shops/components/ShopCard.tsx
import { Store } from "@/services/stores";
import { useTheme } from "@/theme";
import { formatDistance } from "@/utils/geo";
import { getStoreOpenState } from "@/utils/storeHours";
import { Heart, MapPin, Store as StoreIcon } from "lucide-react-native";
import { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type ShopCardProps = {
  store: Store;
  onPress: (id: string) => void;
  layout?: "row" | "list";
  distanceKm?: number | null;
  favorite?: boolean;
  onToggleFavorite?: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function OpenBadge({ store }: { store: Store }) {
  const { colors, radius, typography } = useTheme();
  const state = getStoreOpenState(store.hours);
  if (!state.isKnown) return null;
  const open = state.isOpen;
  return (
    <View
      style={{
        backgroundColor: open ? colors.greenSoft : colors.surface2,
        borderRadius: radius.pill,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: "flex-start",
        marginTop: 4,
      }}
    >
      <Text
        style={{
          color: open ? colors.green : colors.muted,
          fontSize: typography.micro,
          fontWeight: "800",
        }}
      >
        {open
          ? `Open · until ${state.closesAt}`
          : `Closed · opens ${state.opensAt}`}
      </Text>
    </View>
  );
}

function MetaText({ children }: { children: React.ReactNode }) {
  const { colors, typography } = useTheme();
  return (
    <Text
      style={{
        color: colors.muted,
        fontSize: typography.micro,
        fontWeight: "600",
      }}
      numberOfLines={1}
    >
      {children}
    </Text>
  );
}

function ShopCardComponent({
  store,
  onPress,
  layout = "list",
  distanceKm,
  favorite,
  onToggleFavorite,
}: ShopCardProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const handlePress = useCallback(() => onPress(store.id), [onPress, store.id]);
  const handleToggleFavorite = useCallback(() => {
    onToggleFavorite?.();
  }, [onToggleFavorite]);

  const heartButton =
    layout === "list" && onToggleFavorite ? (
      <Pressable
        onPress={handleToggleFavorite}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={
          favorite
            ? `Remove ${store.name} from favorites`
            : `Save ${store.name}`
        }
        style={{ padding: spacing.xs, marginRight: -spacing.xs }}
      >
        <Heart
          size={20}
          color={favorite ? colors.danger : colors.muted}
          fill={favorite ? colors.danger : "transparent"}
          strokeWidth={2}
        />
      </Pressable>
    ) : null;

  const shared = {
    accessibilityRole: "button" as const,
    accessibilityLabel: store.name,
    onPress: handlePress,
    onPressIn: () => {
      scale.value = withSpring(0.97);
    },
    onPressOut: () => {
      scale.value = withSpring(1);
    },
  };

  if (layout === "row") {
    return (
      <AnimatedPressable
        {...shared}
        style={[
          styles.rowCard,
          {
            borderColor: colors.line,
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
          },
          animatedStyle,
        ]}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.md,
            backgroundColor: colors.cream,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: spacing.sm,
          }}
        >
          <StoreIcon size={18} color={colors.espresso} strokeWidth={1.8} />
        </View>
        <Text
          style={{
            color: colors.ink,
            fontWeight: "800",
            fontSize: typography.bodySmall,
          }}
          numberOfLines={1}
        >
          {store.name}
          {"  "}
          {distanceKm != null && (
            <MetaText>{formatDistance(distanceKm)}</MetaText>
          )}
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.micro,
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {store.address}
        </Text>
        {(distanceKm != null || getStoreOpenState(store.hours).isKnown) && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              marginTop: spacing.sm,
            }}
          >
            <OpenBadge store={store} />
          </View>
        )}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      {...shared}
      style={[
        styles.listCard,
        {
          borderColor: colors.line,
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: radius.lg,
          backgroundColor: colors.cream,
          alignItems: "center",
          justifyContent: "center",
          marginRight: spacing.md,
        }}
      >
        <StoreIcon size={22} color={colors.espresso} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          <Text
            style={{
              color: colors.ink,
              fontWeight: "800",
              fontSize: typography.body,
              flexShrink: 1,
            }}
            numberOfLines={1}
          >
            {store.name}
          </Text>
          {distanceKm != null && (
            <Text
              style={{
                color: colors.espresso2,
                fontSize: typography.micro,
                fontWeight: "800",
              }}
            >
              {formatDistance(distanceKm)}
            </Text>
          )}
        </View>
        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}
        >
          <MapPin size={11} color={colors.muted} strokeWidth={1.8} />
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.caption,
              marginLeft: 4,
              flexShrink: 1,
            }}
            numberOfLines={1}
          >
            {store.address}
          </Text>
        </View>
        <OpenBadge store={store} />
      </View>
      {heartButton}
    </AnimatedPressable>
  );
}

export const ShopCard = memo(
  ShopCardComponent,
  (prev, next) =>
    prev.store.id === next.store.id &&
    prev.store.name === next.store.name &&
    prev.distanceKm === next.distanceKm &&
    prev.layout === next.layout &&
    prev.store.hours === next.store.hours &&
    prev.favorite === next.favorite,
);

const styles = StyleSheet.create({
  rowCard: { width: 140, borderWidth: 1, padding: 12 },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
});
