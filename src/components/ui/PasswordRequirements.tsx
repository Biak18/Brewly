// src/components/ui/PasswordRequirements.tsx
import { useTheme } from "@/theme";
import { Check, X } from "lucide-react-native";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { getPasswordRequirements } from "@/utils/passwordValidation";

type Props = {
  password: string;
  minLength?: number;
};

export function PasswordRequirements({ password, minLength = 6 }: Props) {
  const { colors, spacing, typography } = useTheme();
  const { t } = useTranslation();
  const req = getPasswordRequirements(password, minLength);

  const items: { met: boolean; label: string }[] = [
    { met: req.length, label: t("auth.passwordReqLength") },
    { met: req.uppercase, label: t("auth.passwordReqUpper") },
    { met: req.special, label: t("auth.passwordReqSpecial") },
  ];

  // Don't show until user starts typing? Show always for guidance, but dim when empty.
  return (
    <View style={{ marginTop: spacing.xs, gap: 4 }}>
      <Text
        style={{
          color: colors.muted,
          fontSize: typography.micro,
          fontWeight: "600",
          marginBottom: 2,
        }}
      >
        {t("auth.passwordRequirements")}
      </Text>
      {items.map((item) => (
        <View
          key={item.label}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: item.met ? colors.greenSoft : colors.surface2,
              borderWidth: 1,
              borderColor: item.met ? colors.green : colors.line,
            }}
          >
            {item.met ? (
              <Check size={10} color={colors.green} strokeWidth={2.5} />
            ) : (
              <X size={10} color={colors.muted} strokeWidth={2} />
            )}
          </View>
          <Text
            style={{
              color: item.met ? colors.green : colors.muted,
              fontSize: typography.caption,
              fontWeight: item.met ? "700" : "500",
            }}
          >
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
