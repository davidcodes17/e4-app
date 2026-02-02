import { ThemedButton } from '@/components/themed-button';
import { ThemedInput } from '@/components/themed-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AuthService } from '@/services/auth.service';
import { validateEmail } from '@/utils/validation';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

export default function DriverEnterEmailScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOtp = async () => {
        const error = validateEmail(email);
        if (error) {
            setEmailError(error);
            return;
        }
        setEmailError(null);
        setIsLoading(true);
        try {
            const response = await AuthService.sendOtp(email);
            if (response.success) {
                router.push({
                    pathname: '/(auth)/driver/otp',
                    params: { email }
                });
            } else {
                Alert.alert('Error', response.message || 'Failed to send OTP');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <ThemedView style={styles.header}>
                        <ThemedText size="3xl" weight="bold" style={styles.title}>
                            Become a driver
                        </ThemedText>
                        <ThemedText size="md" color="#687076">
                            Enter your email to start registration.
                        </ThemedText>
                    </ThemedView>

                    <ThemedView style={styles.form}>
                        <ThemedInput
                            label="Email Address"
                            placeholder="example@email.com"
                            value={email}
                            onChangeText={(val) => {
                                setEmail(val);
                                if (emailError) setEmailError(null);
                            }}
                            error={emailError ?? undefined}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            leftIcon="mail-outline"
                        />

                        <ThemedButton
                            text="Send OTP"
                            onPress={handleSendOtp}
                            isLoading={isLoading}
                            variant="solid"
                            style={styles.button}
                        />
                    </ThemedView>

                    <ThemedView style={styles.footer} align="center">
                        <ThemedText size="sm">
                            Already registered?{' '}
                            <Link href="/(auth)/driver/login" style={styles.link}>
                                <ThemedText size="sm" weight="bold" color="#6C006C">
                                    Log in
                                </ThemedText>
                            </Link>
                        </ThemedText>
                    </ThemedView>
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 32,
    },
    title: {
        marginBottom: 8,
    },
    form: {
        marginBottom: 24,
    },
    button: {
        marginTop: 16,
    },
    footer: {
        marginTop: 'auto',
    },
    link: {
        padding: 4,
    },
});
