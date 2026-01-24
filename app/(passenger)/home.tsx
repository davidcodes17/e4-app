import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

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
                })
            ])
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
            <Animated.View style={[styles.pulseCircle, { transform: [{ scale: scale1 }], opacity: opacity1 }]} />
            <Animated.View style={[styles.pulseCircle, { transform: [{ scale: scale2 }], opacity: opacity2 }]} />
            <View style={styles.centerNode}>
                <Ionicons name="location" size={32} color="#FFFFFF" />
            </View>
            <ThemedText weight="bold" style={styles.loadingText}>Locating you...</ThemedText>
            <ThemedText size="sm" color="#687076">Ensuring the best pickup experience</ThemedText>
        </View>
    );
};

export default function PassengerHomeScreen() {
    const router = useRouter();
    const [pickup, setPickup] = useState('');
    const [destination, setDestination] = useState('');
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permission to access location was denied');
                    return;
                }

                let currentLocation = await Location.getCurrentPositionAsync({});
                setLocation(currentLocation);

                // Try to reverse geocode the pickup location
                const reverseGeocode = await Location.reverseGeocodeAsync({
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                });

                if (reverseGeocode.length > 0) {
                    const address = reverseGeocode[0];
                    setPickup(`${address.name || ''} ${address.street || ''}, ${address.city || ''}`);
                }
            } catch (error) {
                console.error('Error fetching location:', error);
                setErrorMsg('Could not obtain current location');
            }
        })();
    }, []);

    const initialRegion = location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
    } : {
        latitude: 6.5244, // Default to Lagos, Nigeria
        longitude: 3.3792,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                {/* Real-Time Map */}
                <View style={styles.mapContainer}>
                    {!location && !errorMsg ? (
                        <RadarLoader />
                    ) : (
                        <MapView
                            style={styles.map}
                            provider={PROVIDER_GOOGLE}
                            initialRegion={initialRegion}
                            showsUserLocation={true}
                            followsUserLocation={true}
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
                </View>

                {errorMsg && (
                    <ThemedView bg="#FFE5E5" p={10} style={{ margin: 10, borderRadius: 10 }}>
                        <ThemedText color="#FF3B30" size="xs" align="center">{errorMsg}</ThemedText>
                    </ThemedView>
                )}

                <ThemedView style={styles.searchContainer} px={20} py={24}>
                    <ThemedText size="lg" weight="bold" style={styles.greeting}>
                        Hi, where are you going?
                    </ThemedText>

                    <ThemedView style={styles.inputsWrapper}>
                        <ThemedView style={styles.inputRow}>
                            <Ionicons name="radio-button-on" size={20} color="#6C006C" />
                            <TextInput
                                style={styles.input}
                                placeholder="Pickup Location"
                                value={pickup}
                                onChangeText={setPickup}
                                placeholderTextColor="#999"
                            />
                        </ThemedView>

                        {/* <View style={styles.divider} /> */}

                        <ThemedView style={styles.inputRow}>
                            <Ionicons name="location" size={20} color="#FF3B30" />
                            <TextInput
                                style={styles.input}
                                placeholder="Where to?"
                                value={destination}
                                onChangeText={setDestination}
                                placeholderTextColor="#999"
                                onFocus={() => {
                                    // Navigate to ride request or search screen
                                }}
                            />
                        </ThemedView>
                    </ThemedView>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push({
                            pathname: '/(passenger)/ride-request',
                            params: {
                                pickup,
                                pickupLat: location?.coords.latitude.toString(),
                                pickupLong: location?.coords.longitude.toString(),
                                destination
                            }
                        })}
                        disabled={!destination}
                    >
                        <ThemedView
                            style={[
                                styles.buttonInner,
                                { backgroundColor: '#6C006C' },
                                !destination && { opacity: 0.5 }
                            ]}
                            align="center"
                            justify="center"
                        >
                            <ThemedText weight="bold" style={{ color: '#FFFFFF' }}>Find a Ride</ThemedText>
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
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
    },
    radarContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
    },
    centerNode: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#6C006C',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        shadowColor: '#6C006C',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    pulseCircle: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#6C006C',
        zIndex: 1,
    },
    loadingText: {
        marginTop: 40,
        fontSize: 18,
        color: '#11181C',
    },
    searchContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
        paddingBottom: 40,
    },
    greeting: {
        marginBottom: 20,
    },
    inputsWrapper: {
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        padding: 4,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderRadius: 20,
        margin: 5,
        height: 56,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        fontFamily: 'PlusJakartaSans-Regular',
        color: '#11181C',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 48,
    },
    actionButton: {
        marginTop: 24,
    },
    buttonInner: {
        height: 60,
        borderRadius: 20,
    }
});

