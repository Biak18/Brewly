// src/components/coffee/CoffeeImage.tsx
import { useTheme } from "@/theme";
import { Image } from "expo-image";
import { DimensionValue, StyleSheet, View } from "react-native";

type CoffeeImageProps = {
  uri: string;
  height?: DimensionValue;
  width?: DimensionValue;
  radius?: number;
};

const BLURHASH_PLACEHOLDER = "L6Pj0^i_.AyE_3t7t7R**0o#DgR4"; // generic warm-tone placeholder

export function CoffeeImage({
  uri,
  height = 144,
  width,
  radius: cornerRadius,
}: CoffeeImageProps) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        styles.wrap,
        {
          height,
          ...(width !== undefined ? { width } : {}),
          backgroundColor: colors.surface2,
          borderRadius: cornerRadius ?? radius.lg,
        },
      ]}
    >
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
        placeholder={{ blurhash: BLURHASH_PLACEHOLDER }}
        cachePolicy="memory-disk"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: "hidden", position: "relative" },
});
