// src/features/reviews/components/CoffeeReviewForm.tsx
import { Button } from "@/components/ui/Button";
import * as Haptics from "expo-haptics";
import { submitCoffeeReview } from "@/services/reviews";
import { useTheme } from "@/theme";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { StarRating } from "./StarRating";

type CoffeeReviewFormProps = {
  coffeeId: string;
  coffeeName: string;
  orderId: string;
  onSubmitted?: () => void;
};

export function CoffeeReviewForm({
  coffeeId,
  coffeeName,
  orderId,
  onSubmitted,
}: CoffeeReviewFormProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <Text
        style={{
          color: colors.green,
          fontSize: typography.caption,
          fontWeight: "600",
        }}
      >
        Thanks for rating {coffeeName}! ☕
      </Text>
    );
  }

  const submit = async () => {
    if (rating === 0) {
      setError("Tap the stars first");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitCoffeeReview({ coffeeId, orderId, rating, comment });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
      onSubmitted?.();
    } catch {
      setError("Could not save your rating");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View
      style={{
        padding: spacing.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.surface,
        gap: spacing.sm,
      }}
    >
      <Text
        style={{
          color: colors.ink,
          fontSize: typography.bodySmall,
          fontWeight: "800",
        }}
      >
        How was your {coffeeName}?
      </Text>
      <StarRating value={rating} onChange={setRating} />
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Optional. Tell others what you think"
        placeholderTextColor={colors.muted}
        multiline
        maxLength={500}
        style={{
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: radius.md,
          minHeight: 64,
          padding: 10,
          fontSize: typography.bodySmall,
          color: colors.ink,
          textAlignVertical: "top",
        }}
      />
      {!!error && (
        <Text style={{ color: colors.danger, fontSize: typography.micro }}>
          {error}
        </Text>
      )}
      <Button
        label="Submit rating"
        onPress={() => {
          void submit();
        }}
        loading={submitting}
        variant="soft"
      />
    </View>
  );
}
