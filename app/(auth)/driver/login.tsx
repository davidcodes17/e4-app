import { ThemedButton } from '@/components/themed-button';
import { ThemedInput } from '@/components/themed-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DriverService } from '@/services/driver.service';
import { validateEmail, validatePassword } from '@/utils/validation';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function DriverLoginScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [form, setForm] = useState({
        email: '',
        password: '',
    });

    const handleLogin = async () => {
        const newErrors = {
            email: validateEmail(form.email),
            password: validatePassword(form.password),
        };
        setErrors(newErrors);

        if (newErrors.email || newErrors.password) return;

        setIsLoading(true);
        try {
            await DriverService.login(form.email, form.password);
            router.replace('/(driver)/home');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Login failed.');
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
                            Driver login
                        </ThemedText>
                        <ThemedText size="md" color="#687076">
                            Log in to start earning.
                        </ThemedText>
                    </ThemedView>

                    <ThemedView style={styles.form}>
                        <ThemedInput
                            label="Email Address"
                            placeholder="example@email.com"
                            value={form.email}
                            onChangeText={(val) => {
                                setForm({ ...form, email: val });
                                if (errors.email) setErrors({ ...errors, email: null });
                            }}
                            error={errors.email ?? undefined}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            leftIcon="mail-outline"
                        />
                        <ThemedInput
                            label="Password"
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

                        <TouchableOpacity style={styles.forgotPassword}>
                            <ThemedText size="sm" weight="bold" color="#6C006C" textAlign='right'>
                                Forgot Password?
                            </ThemedText>
                        </TouchableOpacity>

                        <ThemedButton
                            text="Log In"
                            onPress={handleLogin}
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
    forgotPassword: {
        marginBottom: 24,
        alignSelf: 'flex-end',
    },
    button: {
        marginTop: 16,
    },
});
