import { ThemedButton } from '@/components/themed-button';
import { ThemedInput } from '@/components/themed-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DriverService } from '@/services/driver.service';
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
            const response = await DriverService.validateOtp(email, otp);
            const token = response?.data?.data?.accessToken;
            router.push({
                pathname: '/(auth)/driver/personal-info',
                params: { email, token }
            });
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Invalid code.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) return;
        try {
            await DriverService.sendOtp(email);
            Alert.alert('Success', 'Verification code resent.');
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
