// src/features/reviews/components/OrderReviewSection.tsx
import { CoffeeReviewForm } from "./CoffeeReviewForm";
import { fetchReviewedCoffeeIds } from "@/services/reviews";
import { useTheme } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Text, View } from "react-native";

type OrderItem = {
  coffee_id: string;
  coffees: { name: string; image_url: string | null } | null;
};

type OrderReviewSectionProps = {
  orderId: string;
  items: OrderItem[];
  refreshKey?: number;
};

export function OrderReviewSection({
  orderId,
  items,
  refreshKey = 0,
}: OrderReviewSectionProps) {
  const { colors, spacing, typography } = useTheme();
  const reviewedIds = useQuery({
    queryKey: ["reviews", "order", orderId, refreshKey],
    queryFn: () => fetchReviewedCoffeeIds(orderId),
  });

  // Distinct coffees in the order that haven't been reviewed yet.
  const pending = useMemo(() => {
    if (!items.length || !reviewedIds.data) return [];
    const seen = new Set<string>();
    const out: { coffeeId: string; name: string }[] = [];
    for (const item of items) {
      if (seen.has(item.coffee_id)) continue;
      seen.add(item.coffee_id);
      if (reviewedIds.data.includes(item.coffee_id)) continue;
      out.push({
        coffeeId: item.coffee_id,
        name: item.coffees?.name ?? "your drink",
      });
    }
    return out;
  }, [items, reviewedIds.data]);

  if (pending.length === 0) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <Text
        style={{
          color: colors.ink,
          fontSize: typography.body,
          fontWeight: "800",
        }}
      >
        Rate your drinks
      </Text>
      {pending.map((p) => (
        <CoffeeReviewForm
          key={p.coffeeId}
          coffeeId={p.coffeeId}
          coffeeName={p.name}
          orderId={orderId}
          onSubmitted={() => reviewedIds.refetch()}
        />
      ))}
    </View>
  );
}
