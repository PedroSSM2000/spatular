import { Feather } from "@expo/vector-icons";
import { Text, TextInput, View } from "dripsy";
import { useDataDbApi } from "hooks";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, SectionList } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { drinkApi, foodApi } from "services";
import tw from "styles";
import { useDeviceContext } from "twrnc";
import { convertToAlphabeticalSections, parseIngredients } from "utils";
import IngredientCard from "./IngredientCard";

interface ExploreByIngredientProps {
  type: "drink" | "food";
}

export default function ExploreByIngredient(props: ExploreByIngredientProps) {
  const { type } = props;

  const Api = type === "drink" ? drinkApi : foodApi;

  const [search, setSearch] = useState("");

  const [allIngredients, loading] = useDataDbApi(Api.getIngredients(), {
    parser: parseIngredients,
  });

  const ingredients = useMemo(
    () =>
      allIngredients.filter((ingredient) =>
        ingredient.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, allIngredients],
  );

  const ingredientSections = useMemo(
    () => convertToAlphabeticalSections(ingredients),
    [ingredients],
  );

  useDeviceContext(tw);

  const scrollY = useSharedValue(0);
  const searchBarPosition = useSharedValue(0);
  const translateStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: searchBarPosition.value,
      },
    ],
  }));

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        color={tw.color("orange-600")}
        style={tw`mt-4`}
      />
    );

  return (
    <>
      <Animated.View
        style={[tw`absolute top-0 right-0 left-0 p-4 z-99`, translateStyle]}
      >
        <View
          sx={tw`shadow-md justify-between w-full max-w-140 self-center border-stone-100 dark:border-neutral-800 dark:border-neutral border bg-stone-200 flex-row items-center dark:bg-neutral-900 pl-5 pr-4 py-2.5 android:py-2 rounded-full`}
        >
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={
              tw`text-stone-400 dark:text-neutral-700`.color as string
            }
            placeholder="Search for an ingredient..."
            textAlignVertical="center"
            sx={tw`text-[17px] grow font-dmsans text-stone-800 rounded-full dark:text-neutral-300 pl-4 -ml-4 py-2.5 android:py-2 -my-2.5 android:-my-2 z-99`}
          />

          <Feather
            name="search"
            size={24}
            color={tw`text-stone-400 dark:text-neutral-700`.color as string}
          />
        </View>
      </Animated.View>

      <SectionList
        sections={ingredientSections}
        renderItem={({ item }) => <IngredientCard data={item} />}
        contentContainerStyle={tw`pt-16 px-4`}
        keyExtractor={(item) => item.name}
        scrollEventThrottle={30}
        onScroll={({ nativeEvent }) => {
          const { y } = nativeEvent.contentOffset;

          const shouldSkip =
            // skip when the the scroll is insignificant
            Math.abs(y - scrollY.value) < 15 ||
            // iOS only: skip when the scroll is outside the bounds
            y < 0 ||
            y >
              nativeEvent.contentSize.height -
                nativeEvent.layoutMeasurement.height;

          if (shouldSkip) return;

          const isScrollingUp = y < scrollY.value;
          const isScrollingDown = y > scrollY.value;

          if (isScrollingDown && searchBarPosition.value === 0)
            searchBarPosition.value = withTiming(-70);

          if (isScrollingUp && searchBarPosition.value === -70)
            searchBarPosition.value = withTiming(0);

          scrollY.value = y;
        }}
        renderSectionHeader={SectionHeader}
        stickySectionHeadersEnabled={false}
      />
    </>
  );
}

interface SectionHeaderProps {
  section: {
    title: string;
  };
}

function SectionHeader({ section }: SectionHeaderProps) {
  const { title } = section;

  return (
    <View
      sx={tw`flex-row self-center w-full max-w-134 items-center px-3 mt-3 mb-2`}
    >
      <Text
        sx={tw`text-4xl font-dmsans mr-4 text-stone-600 dark:text-neutral-400 font-bold`}
      >
        {title}
      </Text>

      <View
        sx={tw`flex-1 h-[3px] -mt-1.5 rounded bg-stone-200 dark:bg-neutral-900`}
      />
    </View>
  );
}
