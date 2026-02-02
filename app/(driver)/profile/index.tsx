import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AuthService } from '@/services/auth.service';
import { DriverService } from '@/services/driver.service';
import { Driver } from '@/services/types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function DriverProfileScreen() {
    const [driver, setDriver] = useState<Driver | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await DriverService.getProfile();
            if (response.success) {
                setDriver(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await AuthService.logout();
        router.replace('/(auth)/login');
    };

    if (isLoading) {
        return (
            <ThemedView style={styles.center}>
                <ActivityIndicator size="large" color="#6C006C" />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Driver Profile</ThemedText>
            </View>

            <View style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: `https://ui-avatars.com/api/?name=${driver?.firstName}+${driver?.lastName}&background=6C006C&color=fff&size=128` }}
                        style={styles.avatar}
                    />
                    <TouchableOpacity style={styles.editButton} onPress={() => router.push('/(driver)/profile/edit')}>
                        <Ionicons name="pencil" size={18} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <ThemedText style={styles.userName}>{driver?.firstName} {driver?.lastName}</ThemedText>
                <ThemedText style={styles.userEmail}>{driver?.email}</ThemedText>

                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <ThemedText style={styles.statValue}>4.9</ThemedText>
                        <ThemedText style={styles.statLabel}>Rating</ThemedText>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <ThemedText style={styles.statValue}>128</ThemedText>
                        <ThemedText style={styles.statLabel}>Trips</ThemedText>
                    </View>
                </View>
            </View>

            <View style={styles.menuContainer}>
                <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>Account</ThemedText>
                </View>

                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(driver)/history')}>
                    <View style={styles.menuIconContainer}>
                        <Ionicons name="time-outline" size={22} color="#6C006C" />
                    </View>
                    <ThemedText style={styles.menuText}>Earnings History</ThemedText>
                    <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </TouchableOpacity>

                <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>Vehicle Details</ThemedText>
                </View>

                <View style={styles.detailCard}>
                    <View style={styles.detailItem}>
                        <ThemedText style={styles.detailLabel}>Vehicle</ThemedText>
                        <ThemedText style={styles.detailValue}>{driver?.brand} {driver?.model}</ThemedText>
                    </View>
                    <View style={styles.detailItem}>
                        <ThemedText style={styles.detailLabel}>Plate Number</ThemedText>
                        <ThemedText style={styles.detailValue}>{driver?.plateNumber}</ThemedText>
                    </View>
                    <View style={styles.detailItem}>
                        <ThemedText style={styles.detailLabel}>Color</ThemedText>
                        <ThemedText style={styles.detailValue}>{driver?.color}</ThemedText>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <ThemedButton
                    text="Log Out"
                    onPress={handleLogout}
                    variant="outline"
                />
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA'
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        height: 200,
        backgroundColor: '#6C006C',
        paddingTop: 60,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30
    },
    backButton: {
        marginRight: 15
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold'
    },
    profileCard: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginTop: -80,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#FFF'
    },
    editButton: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: '#FF8000',
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF'
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333'
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginTop: 4
    },
    statsContainer: {
        flexDirection: 'row',
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        width: '100%',
        justifyContent: 'center',
        gap: 40
    },
    statItem: {
        alignItems: 'center'
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2
    },
    divider: {
        width: 1,
        height: '100%',
        backgroundColor: '#EEE'
    },
    menuContainer: {
        marginTop: 20,
        paddingHorizontal: 20
    },
    sectionHeader: {
        marginTop: 20,
        marginBottom: 10
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        gap: 12
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#6C006C10',
        justifyContent: 'center',
        alignItems: 'center'
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontWeight: '500'
    },
    detailCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        gap: 15
    },
    detailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    detailLabel: {
        fontSize: 14,
        color: '#666'
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333'
    },
    footer: {
        marginTop: 'auto',
        padding: 20,
        paddingBottom: 40
    }
});
