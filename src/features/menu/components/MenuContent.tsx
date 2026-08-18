import { IconButton } from "@/components/ui/IconButton";
import { MenuSort } from "@/services/coffees";
import { useTheme } from "@/theme";
import { MenuView } from "@expo/ui/community/menu";
import * as Haptics from "expo-haptics";
import { SlidersHorizontal } from "lucide-react-native";

const SORT_OPTIONS: { value: MenuSort; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name" },
];

type MenuContentProps = {
  value: MenuSort;
  onChange: (value: MenuSort) => void;
};

export default function MenuContent({ value, onChange }: MenuContentProps) {
  const { colors } = useTheme();

  return (
    <MenuView
      onOpenMenu={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }}
      style={{ backgroundColor: colors.bg }}
      actions={SORT_OPTIONS.map((option) => ({
        id: option.value,
        title: option.label,
      }))}
      onPressAction={(event) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onChange(event.nativeEvent.event as MenuSort);
      }}
    >
      <IconButton
        accessibilityLabel={`Sort: ${
          SORT_OPTIONS.find((option) => option.value === value)?.label
        }`}
        variant={value !== "popular" ? "filled" : "default"}
        onPress={() => {}}
      >
        <SlidersHorizontal
          size={18}
          color={colors.espresso}
          strokeWidth={1.8}
        />
      </IconButton>
    </MenuView>
  );
}
