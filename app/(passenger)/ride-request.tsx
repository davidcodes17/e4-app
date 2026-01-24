import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RideService } from '@/services/ride.service';
import SocketService from '@/services/socket.service';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';

type ScreenState = 'request' | 'searching' | 'found';

interface RideDetails {
    distance: number;
    duration: string;
    fare: number;
}

interface DriverInfo {
    name: string;
    vehicle: string;
    plate: string;
    rating: string;
}

export default function RideRequestScreen() {
    const router = useRouter();
    const { pickup, pickupLat, pickupLong, destination } = useLocalSearchParams<{
        pickup: string;
        pickupLat: string;
        pickupLong: string;
        destination: string;
    }>();

    const [state, setState] = useState<ScreenState>('request');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingEstimates, setIsFetchingEstimates] = useState(true);
    const [rideDetails, setRideDetails] = useState<RideDetails | null>(null);
    const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);

    // Coordinates logic
    const pickupCoords = pickupLat ? {
        latitude: parseFloat(pickupLat),
        longitude: parseFloat(pickupLong)
    } : { latitude: 6.4311, longitude: 3.4697 }; // Fallback

    const destinationCoords = { latitude: 6.4253, longitude: 3.4041 }; // Mock destination for demo

    useEffect(() => {
        const fetchEstimates = async () => {
            try {
                const response = await RideService.getEstimate({
                    pickupLatitude: pickupCoords.latitude,
                    pickupLongitude: pickupCoords.longitude,
                    dropOffLatitude: destinationCoords.latitude,
                    dropOffLongitude: destinationCoords.longitude,
                });

                const estimateData = response?.data?.data;

                if (estimateData) {
                    setRideDetails({
                        distance: estimateData.distance,
                        duration: estimateData.duration,
                        fare: estimateData.estimate,
                    });
                }
            } catch (error) {
                console.error('Failed to fetch estimates:', error);
                Alert.alert('Error', 'Could not get ride estimates. Please try again.');
            } finally {
                setIsFetchingEstimates(false);
            }
        };

        fetchEstimates();
    }, []);

    useEffect(() => {
        if (state === 'searching') {
            SocketService.connect();
            SocketService.subscribe('/user/queue/ride-status', (update) => {
                if (update.status === 'ACCEPTED') {
                    setDriverInfo({
                        name: update.driverName,
                        vehicle: update.vehicleModel,
                        plate: update.plateNumber,
                        rating: update.rating
                    });
                    setState('found');
                }
            });

            return () => {
                SocketService.unsubscribe('/user/queue/ride-status');
            };
        }
    }, [state]);

    const handleRequestRide = async () => {
        if (!rideDetails) return;
        setIsLoading(true);
        setState('searching');
        try {
            await RideService.requestRide({
                fromLocation: pickup || 'Current Location',
                toLocation: destination || 'Victoria Island, Lagos',
                pickupLatitude: pickupCoords.latitude,
                pickupLongitude: pickupCoords.longitude,
                dropOffLatitude: destinationCoords.latitude,
                dropOffLongitude: destinationCoords.longitude,
                distance: rideDetails.distance,
                duration: rideDetails.duration,
                initialFare: rideDetails.fare
            });
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to request ride.');
            setState('request');
            setIsLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            {/* Real-Time Map with Route */}
            <View style={styles.mapContainer}>
                <MapView
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={{
                        latitude: (pickupCoords.latitude + destinationCoords.latitude) / 2,
                        longitude: (pickupCoords.longitude + destinationCoords.longitude) / 2,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                    }}
                >
                    <Marker
                        coordinate={pickupCoords}
                        title="Pickup"
                        pinColor="#6C006C"
                    />
                    <Marker
                        coordinate={destinationCoords}
                        title="Destination"
                        pinColor="#FF3B30"
                    />
                    <Polyline
                        coordinates={[pickupCoords, destinationCoords]}
                        strokeColor="#6C006C"
                        strokeWidth={4}
                    />
                </MapView>
            </View>

            <ThemedView style={styles.bottomSheet} px={24} py={30}>
                {state === 'request' && (
                    <>
                        <View style={styles.dragIndicator} />
                        {isFetchingEstimates ? (
                            <ThemedView py={20} align="center">
                                <ActivityIndicator color="#6C006C" />
                                <ThemedText size="sm" style={{ marginTop: 8 }}>Calculating fare...</ThemedText>
                            </ThemedView>
                        ) : rideDetails ? (
                            <ThemedView style={styles.rideInfoCard} p={20}>
                                <ThemedView flexDirection="row" justify="space-between" align="center" style={styles.infoRow}>
                                    <ThemedView bg="transparent">
                                        <ThemedText size="sm" color="#687076">Distance</ThemedText>
                                        <ThemedText weight="bold">{rideDetails.distance} km</ThemedText>
                                    </ThemedView>
                                    <ThemedView bg="transparent">
                                        <ThemedText size="sm" color="#687076">Est. Time</ThemedText>
                                        <ThemedText weight="bold">{rideDetails?.duration + " mins"}</ThemedText>
                                    </ThemedView>
                                    <ThemedView bg="transparent">
                                        <ThemedText size="sm" color="#687076">Fare</ThemedText>
                                        <ThemedText size="lg" weight="bold" color="#6C006C">₦{rideDetails.fare.toLocaleString()}</ThemedText>
                                    </ThemedView>
                                </ThemedView>
                            </ThemedView>
                        ) : (
                            <ThemedView py={20} align="center">
                                <ThemedText color="#FF3B30">Estimates unavailable</ThemedText>
                            </ThemedView>
                        )}

                        <ThemedButton
                            text="Request Ride"
                            onPress={handleRequestRide}
                            style={styles.mainButton}
                            disabled={isFetchingEstimates || !rideDetails}
                        />
                        <ThemedText size="xs" color="#687076" align="center" style={styles.hint}>
                            You will be notified when a driver accepts.
                        </ThemedText>
                    </>
                )}

                {state === 'searching' && (
                    <ThemedView align="center" py={20}>
                        <ActivityIndicator size="large" color="#6C006C" style={styles.loader} />
                        <ThemedText size="xl" weight="bold" style={styles.statusText}>
                            Looking for nearby drivers…
                        </ThemedText>
                        <ThemedText color="#687076">This may take a few seconds.</ThemedText>
                    </ThemedView>
                )}

                {state === 'found' && driverInfo && (
                    <>
                        <ThemedText size="lg" weight="bold" color="#6C006C" style={styles.foundHeader}>
                            Driver on the way
                        </ThemedText>

                        <ThemedView style={styles.driverCard} flexDirection="row" align="center" p={16}>
                            <View style={styles.avatarPlaceholder} />
                            <ThemedView style={styles.driverDetails} ml={16} bg="transparent">
                                <ThemedText weight="bold">{driverInfo.name}</ThemedText>
                                <ThemedText size="sm" color="#687076">{driverInfo.vehicle} • {driverInfo.plate}</ThemedText>
                            </ThemedView>
                            <ThemedView style={styles.rating} ml="auto" align="center" bg="transparent">
                                <Ionicons name="star" size={16} color="#FFD700" />
                                <ThemedText size="xs" weight="bold">{driverInfo.rating}</ThemedText>
                            </ThemedView>
                        </ThemedView>

                        <ThemedView
                            style={styles.arrivalStatus}
                            py={12}
                            px={16}
                        >
                            <ThemedText weight="bold" color="#0284C7">Arriving soon (3 mins)</ThemedText>
                        </ThemedView>

                        <ThemedButton
                            text="Cancel Ride"
                            variant="outline"
                            onPress={() => router.back()}
                            style={styles.cancelButton}
                        />
                    </>
                )}
            </ThemedView>
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
    bottomSheet: {
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
    dragIndicator: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    rideInfoCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    infoRow: {
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 10,
    },
    mainButton: {
        borderRadius: 20,
        height: 60,
    },
    hint: {
        marginTop: 16,
    },
    loader: {
        marginBottom: 24,
    },
    statusText: {
        marginBottom: 8,
    },
    foundHeader: {
        marginBottom: 20,
    },
    driverCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 16,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F3F4F6',
    },
    driverDetails: {
        flex: 1,
    },
    rating: {
        backgroundColor: '#F9FAFB',
        padding: 8,
        borderRadius: 12,
    },
    arrivalStatus: {
        borderRadius: 16,
        marginBottom: 24,
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
    },
    cancelButton: {
        borderRadius: 20,
        height: 60,
        borderColor: '#FF3B30',
    }
});

