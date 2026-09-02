// src/components/ui/FieldInput.tsx
// Modern replacement for placeholder-only TextInput: always shows a visible label,
// animates a floating label when focused or filled, keeps hint as helper text.
// Uses useTheme colors/spacing/radius/typography + reanimated (UI thread), no Tailwind.
import { useTheme } from "@/theme";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type FieldInputProps = Omit<TextInputProps, "style"> & {
  label: string;
  value: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
};

export function FieldInput({
  label,
  value,
  error,
  hint,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  placeholder,
  ...rest
}: FieldInputProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const [focused, setFocused] = useState(false);
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(focused || !!value ? 1 : 0, { duration: 160 });
  }, [focused, value, progress]);

  const hasError = !!error;
  const borderColor = hasError ? colors.danger : focused ? colors.espresso : colors.line;
  const bg = colors.surface;

  const animatedLabelStyle = useAnimatedStyle(() => ({
    top: 14 + progress.value * -22, // 14 -> -8
    fontSize: 14 + progress.value * -3, // 14 -> 11
  }));

  const staticLabelStyle = {
    position: "absolute" as const,
    left: 12,
    backgroundColor: bg,
    paddingHorizontal: 4,
    zIndex: 1,
    color: hasError ? colors.danger : focused ? colors.espresso : colors.muted,
    fontWeight: "600" as const,
  };

  // Avoid duplicate "Email" ghost: show native placeholder only when it differs from label and field is focused-empty
  const nativePlaceholder =
    focused && !value && placeholder && placeholder !== label ? placeholder : undefined;

  return (
    <View style={[{ gap: 4 }, containerStyle]}>
      <View
        style={[
          styles.wrap,
          {
            borderColor,
            borderRadius: radius.md,
            backgroundColor: bg,
          },
        ]}
      >
        <Animated.Text style={[staticLabelStyle, animatedLabelStyle]}>{label}</Animated.Text>
        <TextInput
          value={value}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholder={nativePlaceholder}
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            {
              color: colors.ink,
              paddingHorizontal: spacing.md,
              fontSize: typography.bodySmall,
            },
            inputStyle,
          ]}
          {...rest}
        />
      </View>
      {!!error ? (
        <Text style={{ color: colors.danger, fontSize: typography.micro }}>{error}</Text>
      ) : !!hint ? (
        <Text style={{ color: colors.muted, fontSize: typography.micro }}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, justifyContent: "center" },
  input: { height: 48, paddingTop: 0, paddingBottom: 0 },
});
