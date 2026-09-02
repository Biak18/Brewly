// src/components/ui/BottomSheet.tsx
// Thin wrapper around @expo/ui/community/bottom-sheet (native platform sheets)
// keeping the app-wide { visible, onClose, children } API. Native sheets handle
// keyboard avoidance inside modals automatically, KeyboardAwareScrollView and
// RN's KeyboardAvoidingView do not work reliably there.
import { useTheme } from "@/theme";
import BottomSheetNative, {
  BottomSheetView,
} from "@expo/ui/community/bottom-sheet";
import { useEffect, useRef, type ReactNode } from "react";

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const { colors, spacing } = useTheme();
  const sheetRef = useRef<BottomSheetNative>(null);

  // Imperative sync with the native sheet; it owns presentation/animation.
  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.close();
  }, [visible]);

  return (
    <BottomSheetNative
      ref={sheetRef}
      index={-1}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: colors.surface }}
    >
      <BottomSheetView style={{ paddingBottom: spacing.xxl }}>
        {children}
      </BottomSheetView>
    </BottomSheetNative>
  );
}
