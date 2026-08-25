// src/features/seller/components/TimePickerSheet.tsx
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useTheme } from "@/theme";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { useEffect, useMemo, useRef } from "react";
import { Pressable, Text, View } from "react-native";

// All valid slot times at 30-minute intervals: "00:00" .. "23:30".
const SLOTS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

export function TimePickerSheet({
  visible,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  /** Currently selected "HH:MM", or null when unset. */
  value: string | null;
  onSelect: (time: string) => void;
  onClose: () => void;
}) {
  const { colors, radius, spacing, typography } = useTheme();
  const listRef = useRef<FlashListRef<string> | null>(null);

  const initialIndex = useMemo(() => {
    const idx = SLOTS.indexOf(value ?? "09:00");
    return idx >= 0 ? idx : 18; // default scroll target: 09:00
  }, [value]);

  // Center the selected slot when the sheet opens.
  useEffect(() => {
    if (visible) {
      const target = Math.max(0, initialIndex - 6);
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({
          index: target,
          animated: false,
          viewPosition: 0,
        });
      });
    }
  }, [visible, initialIndex]);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.sm }}>
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.body,
            fontWeight: "800",
          }}
        >
          Pick a time
        </Text>
      </View>
      <FlashList
        ref={listRef}
        data={SLOTS}
        numColumns={4}
        keyExtractor={(t) => t}
        contentContainerStyle={{ paddingHorizontal: spacing.xl }}
        renderItem={({ item }) => {
          const active = item === value;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
              style={{
                flexBasis: "25%",
                padding: spacing.xs,
              }}
            >
              <View
                style={{
                  height: 40,
                  borderRadius: radius.md,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: active ? colors.espresso : colors.line,
                  backgroundColor: active ? colors.espresso : colors.surface,
                }}
              >
                <Text
                  style={{
                    color: active ? colors.surface : colors.ink,
                    fontSize: typography.caption,
                    fontWeight: active ? "800" : "600",
                  }}
                >
                  {item}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
      <Text
        style={{
          color: colors.muted,
          fontSize: typography.micro,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
        }}
      >
        A closing time earlier than the opening time wraps past midnight.
      </Text>
    </BottomSheet>
  );
}
