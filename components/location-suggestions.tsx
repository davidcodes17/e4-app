import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";

export interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  type: "saved" | "recent" | "popular";
  icon?: string;
}

interface LocationSuggestionsProps {
  suggestions: LocationSuggestion[];
  onSelectLocation: (suggestion: LocationSuggestion) => void;
  visible: boolean;
}

const getIconName = (type: string, customIcon?: string) => {
  if (customIcon) return customIcon;
  switch (type) {
    case "saved":
      return "heart";
    case "recent":
      return "history";
    case "popular":
      return "star";
    default:
      return "location";
  }
};

const getIconColor = (type: string) => {
  switch (type) {
    case "saved":
      return "#E91E63";
    case "recent":
      return "#2196F3";
    case "popular":
      return "#FF9800";
    default:
      return "#6C006C";
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "saved":
      return "Saved Place";
    case "recent":
      return "Recent";
    case "popular":
      return "Popular";
    default:
      return "";
  }
};

export default function LocationSuggestions({
  suggestions,
  onSelectLocation,
  visible,
}: LocationSuggestionsProps) {
  if (!visible || suggestions.length === 0) {
    return null;
  }

  const renderSuggestion = ({ item }: { item: LocationSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => onSelectLocation(item)}
    >
      <View style={styles.iconContainer}>
        <View
          style={[
            styles.iconBackground,
            { backgroundColor: getIconColor(item.type) + "20" },
          ]}
        >
          <Ionicons
            name={getIconName(item.type, item.icon) as any}
            size={20}
            color={getIconColor(item.type)}
          />
        </View>
      </View>

      <View style={styles.textContainer}>
        <ThemedText weight="bold" numberOfLines={1} style={styles.locationName}>
          {item.name}
        </ThemedText>
        <ThemedText
          size="xs"
          color="#999"
          numberOfLines={1}
          style={styles.locationAddress}
        >
          {item.address}
        </ThemedText>
        {item.type !== "popular" && (
          <ThemedText size="xs" color="#6C006C" style={styles.typeLabel}>
            {getTypeLabel(item.type)}
          </ThemedText>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={suggestions}
        renderItem={renderSuggestion}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 350,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  locationName: {
    fontSize: 15,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 12,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 16,
  },
});
