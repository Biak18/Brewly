// src/app/onboarding.tsx
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useTheme } from "@/theme";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  Coffee,
  Heart,
  ReceiptText,
  Store,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutDown,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const SLIDES = [
  {
    icon: Coffee,
    title: "Order ahead",
    description:
      "Browse menus from local roasters, customize your drink, and skip the queue.",
  },
  {
    icon: Heart,
    title: "Save your favorites",
    description:
      "Keep the drinks and shops you love one tap away — we'll remember them.",
  },
  {
    icon: ReceiptText,
    title: "Earn every sip",
    description:
      "Collect loyalty stamps with each order and track your receipt history.",
  },
];

export default function OnboardingScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const [index, setIndex] = useState(0);

  const finish = useCallback(() => {
    completeOnboarding();
    router.replace(session ? "/(tabs)" : "/sign-in");
  }, [completeOnboarding, router, session]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (index === SLIDES.length - 1) finish();
    else setIndex((i) => i + 1);
  }, [index, finish]);

  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];
  const Icon = slide.icon;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.xl }}
    >
      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <Pressable onPress={finish} hitSlop={8} accessibilityLabel="Skip intro">
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.caption,
              fontWeight: "700",
              paddingVertical: spacing.md,
            }}
          >
            Skip
          </Text>
        </Pressable>
      </View>

      <Animated.View
        key={index}
        entering={FadeInDown.springify().damping(14)}
        exiting={FadeOutDown.duration(140)}
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <View
          style={{
            width: 128,
            height: 128,
            borderRadius: 64,
            backgroundColor: colors.cream,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: spacing.xxl,
          }}
        >
          <Icon size={52} color={colors.espresso} strokeWidth={1.6} />
        </View>
        <Text
          style={{
            color: colors.ink,
            fontSize: typography.title,
            fontWeight: "800",
            textAlign: "center",
          }}
        >
          {slide.title}
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.body,
            textAlign: "center",
            marginTop: spacing.md,
            lineHeight: 24,
            maxWidth: 300,
          }}
        >
          {slide.description}
        </Text>
      </Animated.View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: spacing.sm,
          marginBottom: spacing.xxl,
        }}
      >
        {SLIDES.map((_, i) => (
          <Animated.View
            key={i}
            entering={FadeIn.duration(150)}
            style={{
              width: i === index ? 22 : 7,
              height: 7,
              borderRadius: radius.pill,
              backgroundColor: i === index ? colors.espresso : colors.line,
            }}
          />
        ))}
      </View>

      <View style={{ paddingBottom: Math.max(insets.bottom, spacing.lg) }}>
        <Button
          label={isLast ? "Get started" : "Next"}
          onPress={handleNext}
          variant="primary"
        />
        {!session && (
          <Pressable
            onPress={finish}
            style={{ alignSelf: "center", padding: spacing.md }}
          >
            <Text
              style={{
                color: colors.espresso2,
                fontSize: typography.caption,
                fontWeight: "700",
              }}
            >
              I already have an account
            </Text>
          </Pressable>
        )}
      </View>

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: -40,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: colors.surface2,
          opacity: 0.5,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Store size={64} color={colors.cream} strokeWidth={1.2} />
      </View>
    </SafeAreaView>
  );
}
