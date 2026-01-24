import { ThemedButton } from '@/components/themed-button';
import { ThemedInput } from '@/components/themed-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AuthService } from '@/services/auth.service';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function PassengerOtpScreen() {
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();
    const [otp, setOtp] = useState('');
    const [otpError, setOtpError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(30);

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleVerify = async () => {
        if (!otp) {
            setOtpError('OTP is required');
            return;
        }
        if (otp.length < 6) {
            setOtpError('OTP must be 6 digits');
            return;
        }
        if (!email) {
            Alert.alert('Error', 'Session expired. Please try again.');
            router.replace('/(auth)/passenger');
            return;
        }

        setOtpError(null);
        setIsLoading(true);
        try {
            const response = await AuthService.validateOtp(email, otp);
            const token = response?.data?.data?.accessToken;
            router.push({
                pathname: '/(auth)/passenger/register',
                params: { email, token }
            });
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Invalid OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) return;
        try {
            await AuthService.sendOtp(email);
            setTimer(30);
            Alert.alert('Success', 'Verification code resent.');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to resend OTP.');
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
                        <ThemedText variant="default" size="3xl" weight="bold" style={styles.title}>
                            Verify your email
                        </ThemedText>
                        <ThemedText size="md" color="#687076">
                            Enter the 6-digit code sent to your email.
                        </ThemedText>
                    </ThemedView>

                    <ThemedView style={styles.form}>
                        <ThemedInput
                            label="Verification Code"
                            placeholder="000 000"
                            value={otp}
                            onChangeText={(val) => {
                                setOtp(val);
                                if (otpError) setOtpError(null);
                            }}
                            error={otpError ?? undefined}
                            keyboardType="number-pad"
                            maxLength={6}
                            leftIcon="key-outline"
                        />

                        <ThemedView flexDirection="row" align="center" style={styles.resendContainer}>
                            <ThemedText size="sm" color="#687076">
                                Didn't receive the code?{' '}
                            </ThemedText>
                            <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
                                <ThemedText size="sm" weight="bold" color={timer > 0 ? '#999' : '#6C006C'}>
                                    {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                                </ThemedText>
                            </TouchableOpacity>
                        </ThemedView>

                        <ThemedButton
                            text="Verify"
                            onPress={handleVerify}
                            isLoading={isLoading}
                            variant="solid"
                            style={styles.button}
                            disabled={otp.length < 6}
                        />
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
    resendContainer: {
        marginBottom: 24,
        justifyContent: 'center',
    },
    button: {
        marginTop: 16,
    },
});
