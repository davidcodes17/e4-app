import { ThemedButton } from '@/components/themed-button';
import { ThemedInput } from '@/components/themed-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { validateName, validatePassword, validatePhone } from '@/utils/validation';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function DriverPersonalInfoScreen() {
    const router = useRouter();
    const { email, token } = useLocalSearchParams<{ email: string, token: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        middleName: '',
        phoneNumber: '',
        password: '',
        gender: '',
    });

    const handleContinue = () => {
        const newErrors = {
            firstName: validateName(form.firstName),
            lastName: validateName(form.lastName),
            phoneNumber: validatePhone(form.phoneNumber),
            password: validatePassword(form.password),
            gender: !form.gender ? 'Gender is required' : null,
        };
        setErrors(newErrors);

        if (Object.values(newErrors).some(err => err !== null)) return;

        router.push({
            pathname: '/(auth)/driver/vehicle-info',
            params: { ...form, email, token }
        });
    };

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <ThemedView style={styles.header}>
                        <ThemedText size="3xl" weight="bold" style={styles.title}>
                            Personal details
                        </ThemedText>
                        <ThemedText size="md" color="#687076">
                            Make sure your details are accurate.
                        </ThemedText>
                    </ThemedView>

                    <ThemedView style={styles.form}>
                        <ThemedInput
                            label="First Name"
                            placeholder="John"
                            value={form.firstName}
                            onChangeText={(val) => {
                                setForm({ ...form, firstName: val });
                                if (errors.firstName) setErrors({ ...errors, firstName: null });
                            }}
                            error={errors.firstName ?? undefined}
                        />
                        <ThemedInput
                            label="Last Name"
                            placeholder="Doe"
                            value={form.lastName}
                            onChangeText={(val) => {
                                setForm({ ...form, lastName: val });
                                if (errors.lastName) setErrors({ ...errors, lastName: null });
                            }}
                            error={errors.lastName ?? undefined}
                        />
                        <ThemedInput
                            label="Middle Name"
                            placeholder="Edward"
                            value={form.middleName}
                            onChangeText={(val) => setForm({ ...form, middleName: val })}
                        />
                        <ThemedInput
                            label="Phone Number"
                            placeholder="+234 800 000 0000"
                            value={form.phoneNumber}
                            onChangeText={(val) => {
                                setForm({ ...form, phoneNumber: val });
                                if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: null });
                            }}
                            error={errors.phoneNumber ?? undefined}
                            keyboardType="phone-pad"
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
                        />

                        <ThemedText size="sm" weight="bold" style={styles.label}>
                            Gender
                        </ThemedText>
                        <ThemedView flexDirection="row" style={styles.genderContainer}>
                            {['Male', 'Female'].map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.genderButton,
                                        form.gender === option && styles.genderButtonActive,
                                        errors.gender && styles.genderButtonError
                                    ]}
                                    onPress={() => {
                                        setForm({ ...form, gender: option });
                                        if (errors.gender) setErrors({ ...errors, gender: null });
                                    }}
                                >
                                    <ThemedText
                                        size="sm"
                                        weight={form.gender === option ? 'bold' : 'regular'}
                                        style={{ color: form.gender === option ? '#FFFFFF' : '#687076' }}
                                    >
                                        {option}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </ThemedView>
                        {errors.gender && (
                            <ThemedText color="#FF3B30" size="xs" style={styles.errorText}>
                                {errors.gender}
                            </ThemedText>
                        )}

                        <ThemedButton
                            text="Continue"
                            onPress={handleContinue}
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
    },
    header: {
        marginTop: 40,
        marginBottom: 32,
    },
    title: {
        marginBottom: 8,
    },
    form: {
        flex: 1,
    },
    label: {
        marginBottom: 12,
        marginLeft: 4,
    },
    genderContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    genderButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E1E1',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    genderButtonActive: {
        backgroundColor: '#6C006C',
        borderColor: '#6C006C',
    },
    genderButtonError: {
        borderColor: '#FF3B30',
    },
    errorText: {
        marginTop: -16,
        marginBottom: 16,
        marginLeft: 4,
    },
    button: {
        marginTop: 16,
        marginBottom: 40,
    },
});
