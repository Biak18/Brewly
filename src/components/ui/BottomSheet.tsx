// src/components/ui/BottomSheet.tsx
import { useTheme } from "@/theme";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const { colors, radius, spacing } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(screenHeight);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withTiming(0, { duration: 300 });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else if (mounted) {
      translateY.value = withTiming(
        screenHeight,
        { duration: 220 },
        (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        },
      );
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 800) {
        scheduleOnRN(onClose);
      } else {
        translateY.value = withTiming(0, { duration: 300 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!mounted) return null;

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0,0,0,0.4)" },
          backdropStyle,
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close"
        />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xxl,
              borderTopRightRadius: radius.xxl,
              paddingBottom: spacing.xxl,
            },
            sheetStyle,
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.line }]} />
          {children}
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 10 },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
});
