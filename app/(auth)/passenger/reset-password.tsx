import { ThemedButton } from '@/components/themed-button';
import { ThemedInput } from '@/components/themed-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { validatePassword } from '@/utils/validation';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

export default function PassengerNewPasswordScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [form, setForm] = useState({
        password: '',
        confirmPassword: '',
    });

    const handleResetPassword = async () => {
        const newErrors = {
            password: validatePassword(form.password),
            confirmPassword: form.password !== form.confirmPassword ? 'Passwords do not match' : null,
        };
        setErrors(newErrors);

        if (newErrors.password || newErrors.confirmPassword) return;

        setIsLoading(true);
        try {
            // await AuthService.resetPassword(form.password);
            router.replace('/(auth)/passenger/login');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to reset password.');
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
                            Create new password
                        </ThemedText>
                        <ThemedText size="md" color="#687076">
                            Your new password must be secure.
                        </ThemedText>
                    </ThemedView>

                    <ThemedView style={styles.form}>
                        <ThemedInput
                            label="New Password"
                            placeholder="••••••••"
                            value={form.password}
                            onChangeText={(val) => {
                                setForm({ ...form, password: val });
                                if (errors.password) setErrors({ ...errors, password: null });
                            }}
                            error={errors.password ?? undefined}
                            secureTextEntry
                            leftIcon="lock-closed-outline"
                        />
                        <ThemedInput
                            label="Confirm Password"
                            placeholder="••••••••"
                            value={form.confirmPassword}
                            onChangeText={(val) => {
                                setForm({ ...form, confirmPassword: val });
                                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                            }}
                            error={errors.confirmPassword ?? undefined}
                            secureTextEntry
                            leftIcon="lock-closed-outline"
                        />

                        <ThemedButton
                            text="Reset Password"
                            onPress={handleResetPassword}
                            isLoading={isLoading}
                            variant="solid"
                            style={styles.button}
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
