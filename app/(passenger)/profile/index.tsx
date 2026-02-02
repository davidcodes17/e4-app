import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AuthService } from '@/services/auth.service';
import { User } from '@/services/types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await AuthService.getProfile();
            if (response.success) {
                setUser(response.data);
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
            {/* Header / Avatar Section */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Profile</ThemedText>
            </View>

            <View style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6C006C&color=fff&size=128` }}
                        style={styles.avatar}
                    />
                    <TouchableOpacity style={styles.editButton} onPress={() => router.push('/(passenger)/profile/edit')}>
                        <Ionicons name="pencil" size={18} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <ThemedText style={styles.userName}>{user?.firstName} {user?.lastName}</ThemedText>
                <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
            </View>

            {/* Menu Items */}
            <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(passenger)/history')}>
                    <View style={styles.menuIconContainer}>
                        <Ionicons name="time-outline" size={22} color="#6C006C" />
                    </View>
                    <ThemedText style={styles.menuText}>Trip History</ThemedText>
                    <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuIconContainer}>
                        <Ionicons name="card-outline" size={22} color="#6C006C" />
                    </View>
                    <ThemedText style={styles.menuText}>Payment Methods</ThemedText>
                    <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuIconContainer}>
                        <Ionicons name="help-circle-outline" size={22} color="#6C006C" />
                    </View>
                    <ThemedText style={styles.menuText}>Support</ThemedText>
                    <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuIconContainer}>
                        <Ionicons name="settings-outline" size={22} color="#6C006C" />
                    </View>
                    <ThemedText style={styles.menuText}>Settings</ThemedText>
                    <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </TouchableOpacity>
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
    menuContainer: {
        marginTop: 30,
        paddingHorizontal: 20,
        gap: 12
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
    footer: {
        marginTop: 'auto',
        padding: 20,
        paddingBottom: 40
    }
});
