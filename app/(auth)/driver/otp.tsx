import { ThemedButton } from '@/components/themed-button';
import { ThemedInput } from '@/components/themed-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AuthService } from '@/services/auth.service';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function DriverOtpScreen() {
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleVerify = async () => {
        if (!email || otp.length < 6) return;
        setIsLoading(true);
        try {
            const response = await AuthService.validateOtp(email, otp);
            if (response.success) {
                router.push({
                    pathname: '/(auth)/driver/personal-info',
                    params: { email }
                });
            } else {
                Alert.alert('Error', response.message || 'Verification failed');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Invalid code.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) return;
        try {
            const response = await AuthService.sendOtp(email);
            if (response.success) {
                Alert.alert('Success', 'Verification code resent.');
            } else {
                Alert.alert('Error', response.message || 'Failed to resend code.');
            }
        } catch (error: any) {
            Alert.alert('Error', 'Failed to resend code.');
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
                            Verify your email
                        </ThemedText>
                        <ThemedText size="md" color="#687076">
                            Enter the verification code sent to your email.
                        </ThemedText>
                    </ThemedView>

                    <ThemedView style={styles.form}>
                        <ThemedInput
                            label="Verification Code"
                            placeholder="000 000"
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="number-pad"
                            maxLength={6}
                            leftIcon="key-outline"
                        />

                        <ThemedButton
                            text="Verify"
                            onPress={handleVerify}
                            isLoading={isLoading}
                            variant="solid"
                            style={styles.button}
                            disabled={otp.length < 6}
                        />

                        <TouchableOpacity style={styles.resendBtn}>
                            <ThemedText size="sm" weight="bold" color="#6C006C" align="center">
                                Resend OTP
                            </ThemedText>
                        </TouchableOpacity>
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
    resendBtn: {
        marginTop: 24,
    }
});
