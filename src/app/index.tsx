import { CoffeeCard, CoffeeCardData } from "@/components/coffee/CoffeeCard";
import { MOCK_COFFEE_ITEMS } from "@/constants/coffeeData";
import { useThemeStore } from "@/theme/themeStore";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

// Separate Item Component to safely use 'useAnimatedStyle' hook
function CarouselCard({
  item,
  index,
  scrollX,
  cardWidth,
  snapInterval,
}: {
  item: CoffeeCardData;
  index: number;
  scrollX: SharedValue<number>;
  cardWidth: number;
  snapInterval: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * snapInterval,
      index * snapInterval,
      (index + 1) * snapInterval,
    ];

    // Smoothly push inactive cards down
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [16, 0, 16],
      Extrapolation.CLAMP,
    );

    // Scale down inactive cards slightly
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.9, 1, 0.9],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: cardWidth,
          justifyContent: "center",
        },
        animatedStyle,
      ]}
    >
      <CoffeeCard
        coffee={item}
        liked={index % 2 === 0}
        onPress={() => {}}
        onAddToCart={() => {}}
        onToggleFavorite={() => {}}
      />
    </Animated.View>
  );
}

export default function Index() {
  const { width } = useWindowDimensions();
  const colors = useThemeStore((s) => s.colors);

  const CARD_HEIGHT = 300;
  const CARD_WIDTH = width * 0.6;
  const GAP = 5;

  const SIDE_INSET = (width - CARD_WIDTH) / 2;
  const SNAP_INTERVAL = CARD_WIDTH + GAP;

  // Reanimated Shared Value
  const scrollX = useSharedValue(0);

  // Reanimated Scroll Handler running directly on the UI thread
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Animated.FlatList
        data={MOCK_COFFEE_ITEMS}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        snapToAlignment="center"
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{
          width: width,
          height: CARD_HEIGHT + 40,
        }}
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingHorizontal: SIDE_INSET, gap: GAP },
        ]}
        renderItem={({ item, index }) => (
          <CarouselCard
            item={item}
            index={index}
            scrollX={scrollX}
            cardWidth={CARD_WIDTH}
            snapInterval={SNAP_INTERVAL}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
