// src/components/ui/PasswordInput.tsx
import { useTheme } from "@/theme";
import { Eye, EyeOff } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Pressable,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

type PasswordInputProps = Omit<TextInputProps, "secureTextEntry" | "style"> & {
  value: string;
  onChangeText: (text: string) => void;
  containerStyle?: ViewStyle;
};

export function PasswordInput({
  value,
  onChangeText,
  containerStyle,
  placeholder,
  ...rest
}: PasswordInputProps) {
  const { colors, radius } = useTheme();
  const [visible, setVisible] = useState(false);
  const toggleVisible = useCallback(() => setVisible((v) => !v), []);

  return (
    <View style={[{ justifyContent: "center" }, containerStyle]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoComplete="password"
        style={{
          borderWidth: 1,
          borderColor: colors.line,
          height: 48,
          paddingHorizontal: 14,
          paddingRight: 44,
          fontSize: 14,
          color: colors.ink,
          borderRadius: radius.md,
        }}
        {...rest}
      />
      <Pressable
        onPress={toggleVisible}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={visible ? "Hide password" : "Show password"}
        style={{ position: "absolute", right: 14 }}
      >
        {visible ? (
          <EyeOff size={18} color={colors.muted} strokeWidth={1.8} />
        ) : (
          <Eye size={18} color={colors.muted} strokeWidth={1.8} />
        )}
      </Pressable>
    </View>
  );
}
