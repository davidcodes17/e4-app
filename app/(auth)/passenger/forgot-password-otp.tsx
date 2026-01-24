import { ThemedButton } from '@/components/themed-button';
import { ThemedInput } from '@/components/themed-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

export default function PassengerForgotPasswordOtpScreen() {
    const router = useRouter();
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleVerify = async () => {
        if (otp.length < 6) return;
        setIsLoading(true);
        // TODO: Integrate API
        setTimeout(() => {
            setIsLoading(false);
            router.push('/(auth)/passenger/reset-password');
        }, 1000);
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
                            Verify reset code
                        </ThemedText>
                        <ThemedText size="md" color="#687076">
                            Enter the code sent to your email.
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
});
