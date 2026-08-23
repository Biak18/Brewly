// src/features/seller/components/CategoryPicker.tsx
import { Chip } from "@/components/ui/Chip";
import { IconButton } from "@/components/ui/IconButton";
import { useMyCategories } from "@/features/seller/hooks/useMyCategories";
import { createCategory } from "@/services/sellerMenu";
import { useTheme } from "@/theme";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react-native";
import { useCallback, useState } from "react";
import { TextInput, View } from "react-native";

type CategoryPickerProps = {
  storeId: string;
  value: string;
  onChange: (id: string) => void;
};

export function CategoryPicker({
  storeId,
  value,
  onChange,
}: CategoryPickerProps) {
  const { colors, spacing, typography } = useTheme();
  const { data: categories = [] } = useMyCategories(storeId);
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    const category = await createCategory(storeId, newName.trim());
    queryClient.invalidateQueries({ queryKey: ["categories", storeId] });
    onChange(category.id);
    setNewName("");
    setAdding(false);
  }, [newName, storeId, queryClient, onChange]);

  return (
    <View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {categories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            active={value === c.id}
            onPress={() => onChange(c.id)}
          />
        ))}
        <IconButton
          accessibilityLabel="Add category"
          onPress={() => setAdding(true)}
        >
          <Plus size={16} color={colors.espresso} strokeWidth={2} />
        </IconButton>
      </View>
      {adding && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            marginTop: spacing.sm,
          }}
        >
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="New category name"
            placeholderTextColor={colors.muted}
            autoFocus
            onSubmitEditing={handleCreate}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 10,
              height: 40,
              paddingHorizontal: 12,
              color: colors.ink,
              fontSize: typography.bodySmall,
            }}
          />
          <IconButton
            accessibilityLabel="Confirm new category"
            onPress={handleCreate}
          >
            <Plus size={16} color={colors.espresso} strokeWidth={2} />
          </IconButton>
        </View>
      )}
    </View>
  );
}
