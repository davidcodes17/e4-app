import { InlineLoader } from "@/components/common/loaders";
import LocationSuggestions, {
    LocationSuggestion,
} from "@/components/location-suggestions";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { GooglePlacesService } from "@/services/google-places.service";
import { useDebouncedCallback } from "@/utils/debounce";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from "expo-location";
import { Href, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

const RadarLoader = () => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const scale1 = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });

  const opacity1 = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  const scale2 = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });

  const opacity2 = pulseAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.4, 0.2, 0],
  });

  return (
    <View style={styles.radarContainer}>
      <Animated.View
        style={[
          styles.pulseCircle,
          { transform: [{ scale: scale1 }], opacity: opacity1 },
        ]}
      />
      <Animated.View
        style={[
          styles.pulseCircle,
          { transform: [{ scale: scale2 }], opacity: opacity2 },
        ]}
      />
      <View style={styles.centerNode}>
        <Ionicons name="location" size={32} color="#FFFFFF" />
      </View>
      <ThemedText weight="bold" style={styles.loadingText}>
        Locating you...
      </ThemedText>
      <ThemedText size="sm" color="#687076">
        Ensuring the best pickup experience
      </ThemedText>
    </View>
  );
};

export default function PassengerHomeScreen() {
  const router = useRouter();
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] =
    useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [isLoadingPickupSuggestions, setIsLoadingPickupSuggestions] =
    useState(false);
  const [isLoadingDestinationSuggestions, setIsLoadingDestinationSuggestions] =
    useState(false);

  // Mock data for saved and recent locations
  const savedLocations: LocationSuggestion[] = [
    {
      id: "home",
      name: "Home",
      address: "45 Ilupeju Street, Lagos",
      type: "saved",
      icon: "home",
    },
    {
      id: "work",
      name: "Work",
      address: "Tech Hub, Lekki, Lagos",
      type: "saved",
      icon: "briefcase",
    },
  ];

  const recentLocations: LocationSuggestion[] = [
    {
      id: "recent-1",
      name: "Lekki Phase 1",
      address: "Lekki Phase 1, Lagos",
      type: "recent",
    },
    {
      id: "recent-2",
      name: "VI Shopping Mall",
      address: "Victoria Island, Lagos",
      type: "recent",
    },
  ];

  const popularLocations: LocationSuggestion[] = [
    {
      id: "popular-1",
      name: "Murtala Muhammed Int'l Airport",
      address: "Ikeja, Lagos",
      type: "popular",
    },
    {
      id: "popular-2",
      name: "Lekki Toll Gate",
      address: "Lekki-Epe Expressway",
      type: "popular",
    },
  ];

  // ============= FETCH PICKUP SUGGESTIONS (NO DEBOUNCE) =============
  const fetchPickupSuggestions = async (text: string) => {
    if (text.length >= 2) {
      setIsLoadingPickupSuggestions(true);
      // Keep showing suggestions while loading (don't clear)
      try {
        const predictions = await GooglePlacesService.getPlacePredictions(
          text,
          undefined,
          location
            ? {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }
            : undefined,
        );

        const suggestions = [
          ...savedLocations.filter(
            (loc) =>
              loc.name.toLowerCase().includes(text.toLowerCase()) ||
              loc.address.toLowerCase().includes(text.toLowerCase()),
          ),
          ...predictions.map((pred, idx) => ({
            id: `osm-pickup-${idx}`,
            name: pred.main_text,
            address: pred.secondary_text || pred.description,
            type: "recent" as const,
            placeId: pred.place_id,
          })),
        ];

        // Only update when new suggestions are ready
        const nextSuggestions = suggestions.slice(0, 8);
        setPickupSuggestions(nextSuggestions);
        setShowPickupSuggestions(nextSuggestions.length > 0);
      } catch (error) {
        console.error("Error fetching pickup suggestions:", error);
        const filtered = [...savedLocations, ...recentLocations].filter(
          (loc) =>
            loc.name.toLowerCase().includes(text.toLowerCase()) ||
            loc.address.toLowerCase().includes(text.toLowerCase()),
        );
        // Only update when fallback data is ready
        setPickupSuggestions(filtered);
        setShowPickupSuggestions(filtered.length > 0);
      } finally {
        setIsLoadingPickupSuggestions(false);
      }
    } else {
      // Hide suggestions when text is too short, but keep previous data
      setShowPickupSuggestions(false);
      setIsLoadingPickupSuggestions(false);
    }
  };

  // ============= DEBOUNCED PICKUP CHANGE HANDLER (2000ms delay) =============
  const handlePickupChange = useDebouncedCallback((text: string) => {
    fetchPickupSuggestions(text);
  }, 2000);

  // ============= FETCH DESTINATION SUGGESTIONS (NO DEBOUNCE) =============
  const fetchDestinationSuggestions = async (text: string) => {
    if (text.length >= 2) {
      setIsLoadingDestinationSuggestions(true);
      // Keep showing suggestions while loading (don't clear)
      try {
        const predictions = await GooglePlacesService.getPlacePredictions(
          text,
          undefined,
          location
            ? {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }
            : undefined,
        );

        const suggestions = [
          ...savedLocations.filter(
            (loc) =>
              loc.name.toLowerCase().includes(text.toLowerCase()) ||
              loc.address.toLowerCase().includes(text.toLowerCase()),
          ),
          ...recentLocations.filter(
            (loc) =>
              loc.name.toLowerCase().includes(text.toLowerCase()) ||
              loc.address.toLowerCase().includes(text.toLowerCase()),
          ),
          ...predictions.map((pred, idx) => ({
            id: `osm-dest-${idx}`,
            name: pred.main_text,
            address: pred.secondary_text || pred.description,
            type: "popular" as const,
            placeId: pred.place_id,
          })),
        ];

        // Only update when new suggestions are ready
        const nextSuggestions = suggestions.slice(0, 8);
        setDestinationSuggestions(nextSuggestions);
        setShowDestinationSuggestions(nextSuggestions.length > 0);
      } catch (error) {
        console.error("Error fetching destination suggestions:", error);
        const filtered = [
          ...savedLocations,
          ...recentLocations,
          ...popularLocations,
        ].filter(
          (loc) =>
            loc.name.toLowerCase().includes(text.toLowerCase()) ||
            loc.address.toLowerCase().includes(text.toLowerCase()),
        );
        // Only update when fallback data is ready
        setDestinationSuggestions(filtered);
        setShowDestinationSuggestions(filtered.length > 0);
      } finally {
        setIsLoadingDestinationSuggestions(false);
      }
    } else {
      // Hide suggestions when text is too short, but keep previous data
      setShowDestinationSuggestions(false);
      setIsLoadingDestinationSuggestions(false);
    }
  };

  // ============= DEBOUNCED DESTINATION CHANGE HANDLER (2000ms delay) =============
  const handleDestinationChange = useDebouncedCallback((text: string) => {
    fetchDestinationSuggestions(text);
  }, 2000);

  // Handle selecting a pickup location
  const handleSelectPickupLocation = (location: LocationSuggestion) => {
    setPickup(location.address);
    setShowPickupSuggestions(false);
  };

  // Handle selecting a destination location
  const handleSelectDestinationLocation = (location: LocationSuggestion) => {
    setDestination(location.address);
    setShowDestinationSuggestions(false);
  };

  // Show default suggestions when field is focused
  const handlePickupFocus = async () => {
    if (pickup.length === 0) {
      setPickupSuggestions([...savedLocations, ...recentLocations]);
      setShowPickupSuggestions(true);
    }
  };

  const handleDestinationFocus = async () => {
    if (destination.length === 0) {
      try {
        if (location) {
          const nearbyPlaces = await OpenStreetMapService.searchNearbyAmenities(
            location.coords.latitude,
            location.coords.longitude,
            ["restaurant", "shopping_mall", "supermarket", "cafe"],
            8000,
          );

          const suggestions = [
            ...savedLocations,
            ...recentLocations,
            ...nearbyPlaces.map((place) => ({
              id: place.placeId,
              name: place.name,
              address: place.address,
              type: "popular" as const,
            })),
          ];

          setDestinationSuggestions(suggestions.slice(0, 10));
        } else {
          setDestinationSuggestions([
            ...savedLocations,
            ...recentLocations,
            ...popularLocations,
          ]);
        }
      } catch (error) {
        console.error("Error fetching nearby places:", error);
        setDestinationSuggestions([
          ...savedLocations,
          ...recentLocations,
          ...popularLocations,
        ]);
      }
      setShowDestinationSuggestions(true);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);

        // Use Google Places Service for reverse geocoding
        const address = await GooglePlacesService.getAddressFromCoordinates(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
        );

        if (address) {
          setPickup(address);
        }
      } catch (error) {
        console.error("Error fetching location:", error);
        setErrorMsg("Could not obtain current location");
      }
    })();
  }, []);

  const initialRegion = location
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }
    : {
        latitude: 6.5244, // Default to Lagos, Nigeria
        longitude: 3.3792,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Real-Time Map */}
        <View style={styles.mapContainer}>
          {/* Floating Profile Button */}
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push("/(passenger)/profile" as Href)}
          >
            <Ionicons name="person" size={24} color="#6C006C" />
          </TouchableOpacity>

          {!location && !errorMsg ? (
            <RadarLoader />
          ) : (
            <MapView
              style={styles.map}
              mapType="standard"
              initialRegion={initialRegion}
              showsUserLocation={true}
              followsUserLocation={true}
              provider="google"
            >
              {location && (
                <Marker
                  coordinate={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }}
                  title="My Location"
                  pinColor="#6C006C"
                />
              )}
            </MapView>
          )}

          {errorMsg && (
            <ThemedView
              bg="#FFE5E5"
              p={10}
              style={{ margin: 10, borderRadius: 10 }}
            >
              <ThemedText color="#FF3B30" size="xs" align="center">
                {errorMsg}
              </ThemedText>
            </ThemedView>
          )}
        </View>

        <ThemedView style={styles.searchContainer} px={20} py={24}>
          <ThemedText size="lg" weight="bold" style={styles.greeting}>
            Hi, where are you going?
          </ThemedText>

          <View style={styles.inputsWrapperContainer}>
            <View style={styles.inputsWrapperWithSuggestions}>
              <ThemedView style={styles.inputsWrapper}>
                <ThemedView style={styles.inputRow}>
                  <Ionicons name="radio-button-on" size={20} color="#6C006C" />
                  <TextInput
                    style={styles.input}
                    placeholder="Pickup Location"
                    value={pickup}
                    onChangeText={(text) => {
                      setPickup(text);
                      handlePickupChange(text);
                    }}
                    onFocus={handlePickupFocus}
                    placeholderTextColor="#999"
                  />
                </ThemedView>

                <ThemedView style={styles.inputRow}>
                  <Ionicons name="location" size={20} color="#FF3B30" />
                  <TextInput
                    style={styles.input}
                    placeholder="Where to?"
                    value={destination}
                    onChangeText={(text) => {
                      setDestination(text);
                      handleDestinationChange(text);
                    }}
                    onFocus={handleDestinationFocus}
                    placeholderTextColor="#999"
                  />
                </ThemedView>
              </ThemedView>

              {/* Pickup Location Suggestions */}
              {(showPickupSuggestions || isLoadingPickupSuggestions) && (
                <View style={styles.suggestionsOverlay}>
                  {isLoadingPickupSuggestions ? (
                    <View style={styles.loadingContainer}>
                      <InlineLoader color="#6C006C" size={5} />
                      <ThemedText
                        size="sm"
                        color="#999"
                        style={styles.loadingText}
                      >
                        Searching locations...
                      </ThemedText>
                    </View>
                  ) : (
                    <LocationSuggestions
                      suggestions={pickupSuggestions}
                      onSelectLocation={handleSelectPickupLocation}
                      visible={showPickupSuggestions}
                    />
                  )}
                </View>
              )}

              {/* Destination Location Suggestions */}
              {(showDestinationSuggestions ||
                isLoadingDestinationSuggestions) && (
                <View style={styles.suggestionsOverlay}>
                  {isLoadingDestinationSuggestions ? (
                    <View style={styles.loadingContainer}>
                      <InlineLoader color="#6C006C" size={5} />
                      <ThemedText
                        size="sm"
                        color="#999"
                        style={styles.loadingText}
                      >
                        Searching locations...
                      </ThemedText>
                    </View>
                  ) : (
                    <LocationSuggestions
                      suggestions={destinationSuggestions}
                      onSelectLocation={handleSelectDestinationLocation}
                      visible={showDestinationSuggestions}
                    />
                  )}
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                marginTop:
                  showPickupSuggestions || showDestinationSuggestions
                    ? 200
                    : 24,
              },
            ]}
            onPress={() =>
              router.push({
                pathname: "/(passenger)/ride-request",
                params: {
                  pickup,
                  pickupLat: location?.coords.latitude.toString(),
                  pickupLong: location?.coords.longitude.toString(),
                  destination,
                },
              })
            }
            disabled={!destination}
          >
            <ThemedView
              style={[
                styles.buttonInner,
                { backgroundColor: "#6C006C" },
                !destination && { opacity: 0.5 },
              ]}
              align="center"
              justify="center"
            >
              <ThemedText weight="bold" style={{ color: "#FFFFFF" }}>
                Find a Ride
              </ThemedText>
            </ThemedView>
          </TouchableOpacity>
        </ThemedView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
  },
  radarContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  centerNode: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#6C006C",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    shadowColor: "#6C006C",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  pulseCircle: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#6C006C",
    zIndex: 1,
  },
  loadingText: {
    marginTop: 40,
    fontSize: 18,
    color: "#11181C",
  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    paddingBottom: 40,
    zIndex: 1,
    overflow: "visible",
  },
  greeting: {
    marginBottom: 20,
  },
  inputsWrapperContainer: {
    position: "relative",
    zIndex: 10,
  },
  inputsWrapper: {
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    padding: 4,
    zIndex: 10,
  },
  inputsWrapperWithSuggestions: {
    position: "relative",
    zIndex: 10,
  },
  suggestionsOverlay: {
    position: "absolute",
    top: 120,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: "transparent",
  },
  loadingContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 100,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 20,
    margin: 5,
    height: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: "PlusJakartaSans-Regular",
    color: "#11181C",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 48,
  },
  actionButton: {
    zIndex: 5,
  },
  buttonInner: {
    height: 60,
    borderRadius: 20,
  },
  profileButton: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
});
