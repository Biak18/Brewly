// src/components/ui/FormScrollView.tsx
// Drop-in replacement for ScrollView on form screens: keeps the focused
// TextInput above the keyboard and lets taps persist while it's open.
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import React from "react";

type FormScrollViewProps = React.ComponentProps<
  typeof KeyboardAwareScrollView
>;

export function FormScrollView({
  showsVerticalScrollIndicator = false,
  showsHorizontalScrollIndicator = false,
  contentContainerStyle,
  ...rest
}: FormScrollViewProps) {
  return (
    <KeyboardAwareScrollView
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      keyboardShouldPersistTaps="handled"
      bottomOffset={12}
      contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
      {...rest}
    />
  );
}
