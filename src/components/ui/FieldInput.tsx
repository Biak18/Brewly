// src/components/ui/FieldInput.tsx
// Modern replacement for placeholder-only TextInput: always shows a visible label,
// animates a floating label when focused or filled, keeps hint as helper text.
// Uses useTheme colors/spacing/radius/typography — no Tailwind.
import { useTheme } from "@/theme";
import { useEffect, useMemo, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

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
  // Animated value persists for lifetime of field; interpolate is render-safe for Animated
  const anim = useMemo(() => new Animated.Value(value ? 1 : 0), []);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: focused || !!value ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [focused, value, anim]);

  const hasError = !!error;
  const borderColor = hasError ? colors.danger : focused ? colors.espresso : colors.line;
  const bg = colors.surface;

  const labelStyle = {
    position: "absolute" as const,
    left: 12,
    backgroundColor: bg,
    paddingHorizontal: 4,
    zIndex: 1,
    color: hasError ? colors.danger : focused ? colors.espresso : colors.muted,
    top: anim.interpolate({ inputRange: [0, 1], outputRange: [14, -8] }),
    fontSize: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 11] }),
    fontWeight: "600" as const,
  };

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
        <Animated.Text style={labelStyle}>{label}</Animated.Text>
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
          placeholder={focused ? placeholder : undefined}
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
