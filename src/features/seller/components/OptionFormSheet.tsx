// src/features/seller/components/OptionFormSheet.tsx
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { useMyCategories } from "@/features/seller/hooks/useMyCategories";
import {
  createOption,
  deleteOption,
  OptionType,
  SellerOption,
  setOptionCategoryScoping,
  updateOption,
} from "@/services/sellerOptions";
import { useConfirmDialogStore } from "@/stores/confirmDialogStore";
import { useTheme } from "@/theme";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

const TYPES: { value: OptionType; label: string }[] = [
  { value: "size", label: "Size" },
  { value: "temperature", label: "Temperature" },
  { value: "milk", label: "Milk" },
  { value: "extra", label: "Extra" },
];

type OptionFormSheetProps = {
  storeId: string;
  option: SellerOption | null;
  onDone: () => void;
};

export function OptionFormSheet({
  storeId,
  option,
  onDone,
}: OptionFormSheetProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const { data: categories = [] } = useMyCategories(storeId);
  const queryClient = useQueryClient();
  const showConfirm = useConfirmDialogStore((s) => s.show);
  const isEditing = !!option;

  const [type, setType] = useState<OptionType>(option?.type ?? "size");
  const [label, setLabel] = useState(option?.label ?? "");
  const [priceDelta, setPriceDelta] = useState(
    option ? String(option.price_delta) : "0",
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    option?.categoryIds ?? [],
  );
  const [isSaving, setIsSaving] = useState(false);

  const toggleCategory = useCallback((id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!label.trim()) return;
    const delta = Number(priceDelta) || 0;
    setIsSaving(true);
    try {
      const optionId = isEditing
        ? option!.id
        : await createOption(storeId, {
            type,
            label: label.trim(),
            price_delta: delta,
          });
      if (isEditing)
        await updateOption(option!.id, {
          label: label.trim(),
          price_delta: delta,
        });
      await setOptionCategoryScoping(optionId, selectedCategoryIds);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["seller-options", storeId] });
      onDone();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  }, [
    label,
    priceDelta,
    type,
    option,
    isEditing,
    storeId,
    selectedCategoryIds,
    queryClient,
    onDone,
  ]);

  const handleDelete = useCallback(() => {
    if (!option) return;
    showConfirm({
      title: "Delete this option?",
      message: `"${option.label}" will be removed. Coffees already ordered with it keep their record — this only affects future orders.`,
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: async () => {
        await deleteOption(option.id);
        queryClient.invalidateQueries({
          queryKey: ["seller-options", storeId],
        });
        onDone();
      },
    });
  }, [option, storeId, queryClient, onDone, showConfirm]);

  return (
    <ScrollView
      style={{ maxHeight: 480 }}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xl,
      }}
    >
      <Text
        style={{
          color: colors.ink,
          fontSize: typography.subheading,
          fontWeight: "800",
          marginBottom: spacing.md,
        }}
      >
        {isEditing ? "Edit option" : "Add option"}
      </Text>

      {!isEditing && (
        <View style={{ marginBottom: spacing.md }}>
          <Text
            style={{
              color: colors.ink,
              fontWeight: "700",
              fontSize: typography.bodySmall,
              marginBottom: spacing.sm,
            }}
          >
            Type
          </Text>
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}
          >
            {TYPES.map((t) => (
              <Chip
                key={t.value}
                label={t.label}
                active={type === t.value}
                onPress={() => setType(t.value)}
              />
            ))}
          </View>
        </View>
      )}

      <Text
        style={{
          color: colors.ink,
          fontWeight: "700",
          fontSize: typography.bodySmall,
          marginBottom: spacing.sm,
        }}
      >
        Label
      </Text>
      <TextInput
        value={label}
        onChangeText={setLabel}
        placeholder="e.g. Oat milk"
        placeholderTextColor={colors.muted}
        style={{
          borderWidth: 1,
          borderColor: colors.line,
          height: 44,
          paddingHorizontal: 12,
          fontSize: 14,
          color: colors.ink,
          borderRadius: radius.md,
          marginBottom: spacing.md,
        }}
      />

      <Text
        style={{
          color: colors.ink,
          fontWeight: "700",
          fontSize: typography.bodySmall,
          marginBottom: spacing.sm,
        }}
      >
        Price add-on
      </Text>
      <TextInput
        value={priceDelta}
        onChangeText={setPriceDelta}
        placeholder="0.00"
        placeholderTextColor={colors.muted}
        keyboardType="decimal-pad"
        style={{
          borderWidth: 1,
          borderColor: colors.line,
          height: 44,
          paddingHorizontal: 12,
          fontSize: 14,
          color: colors.ink,
          borderRadius: radius.md,
          marginBottom: spacing.md,
        }}
      />

      <Text
        style={{
          color: colors.ink,
          fontWeight: "700",
          fontSize: typography.bodySmall,
          marginBottom: 4,
        }}
      >
        Applies to
      </Text>
      <Text
        style={{
          color: colors.muted,
          fontSize: typography.micro,
          marginBottom: spacing.sm,
        }}
      >
        Leave none selected to apply to every category.
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.sm,
          marginBottom: spacing.xl,
        }}
      >
        {categories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            active={selectedCategoryIds.includes(c.id)}
            onPress={() => toggleCategory(c.id)}
          />
        ))}
      </View>

      <Button
        label={isEditing ? "Save changes" : "Add option"}
        onPress={handleSave}
        loading={isSaving}
        variant="primary"
      />
      {isEditing && (
        <View style={{ marginTop: spacing.sm }}>
          <Button
            label="Delete option"
            onPress={handleDelete}
            variant="danger"
          />
        </View>
      )}
    </ScrollView>
  );
}
