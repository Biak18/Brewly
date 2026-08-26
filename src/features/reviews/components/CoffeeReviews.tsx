// src/features/reviews/components/CoffeeReviews.tsx
import { StarRating } from "./StarRating";
import { CoffeeReview, fetchCoffeeReviews } from "@/services/reviews";
import { useTheme } from "@/theme";
import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";

export function CoffeeReviews({ coffeeId }: { coffeeId: string }) {
  const { colors, spacing, typography } = useTheme();
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", "coffee", coffeeId],
    queryFn: () => fetchCoffeeReviews(coffeeId),
  });

  if (isLoading) return null;
  const list = reviews ?? [];
  if (list.length === 0) return null;

  const avg =
    list.reduce((sum, r) => sum + r.rating, 0) / Math.max(list.length, 1);

  return (
    <View style={{ marginTop: spacing.xxl }}>
      <Text
        style={{
          color: colors.ink,
          fontSize: typography.body,
          fontWeight: "800",
          marginBottom: spacing.sm,
        }}
      >
        Reviews ({list.length})
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        <StarRating value={Math.round(avg)} size={18} />
        <Text style={{ color: colors.muted, fontSize: typography.caption }}>
          {avg.toFixed(1)} out of 5
        </Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        {list.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </View>
    </View>
  );
}

function ReviewCard({ review }: { review: CoffeeReview }) {
  const { colors, radius, spacing, typography } = useTheme();
  const date = new Date(review.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <View
      style={{
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.line,
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
        <StarRating value={review.rating} size={14} />
        <Text style={{ color: colors.muted, fontSize: typography.micro }}>
          {date}
        </Text>
      </View>
      {!!review.comment && (
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.bodySmall,
            marginTop: spacing.xs,
            lineHeight: 19,
          }}
        >
          {review.comment}
        </Text>
      )}
      <Text
        style={{ color: colors.muted, fontSize: typography.micro, marginTop: spacing.xs }}
      >
        — {review.reviewer_name}
      </Text>
    </View>
  );
}
