import { Colors } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, useColorScheme } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface ThemedInputProps extends TextInputProps {
    label?: string;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    error?: string;
    onRightIconPress?: () => void;
}

export function ThemedInput({
    label,
    leftIcon,
    rightIcon,
    error,
    onRightIconPress,
    secureTextEntry,
    style,
    ...props
}: ThemedInputProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const activeColors = Colors[isDark ? 'dark' : 'light'];

    // Toggle password visibility logic if it's a password field
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isPassword = !!secureTextEntry;

    // Determine which right icon to show (prop vs password toggle)
    const effectiveRightIcon = isPassword
        ? (isPasswordVisible ? 'eye-off' : 'eye')
        : rightIcon;

    const handleRightIconPress = () => {
        if (isPassword) {
            setIsPasswordVisible(!isPasswordVisible);
        } else if (onRightIconPress) {
            onRightIconPress();
        }
    };

    return (
        <ThemedView style={[styles.container, style as any]} bg="transparent">
            {label && (
                <ThemedText size="sm" weight="bold" color={activeColors.text} style={styles.label}>
                    {label}
                </ThemedText>
            )}

            <ThemedView
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
                        borderColor: error ? '#FF3B30' : 'transparent',
                        borderWidth: 1
                    }
                ]}
                flexDirection="row"
                align="center"
                px={12}
            >
                {leftIcon && (
                    <Ionicons
                        name={leftIcon}
                        size={20}
                        color={activeColors.icon}
                        style={styles.leftIcon}
                    />
                )}

                <TextInput
                    style={[
                        styles.input,
                        { color: activeColors.text, fontFamily: "PlusJakartaSans-Medium" }
                    ]}
                    placeholderTextColor={isDark ? '#888' : '#999'}
                    secureTextEntry={isPassword && !isPasswordVisible}
                    {...props}
                />

                {effectiveRightIcon && (
                    <TouchableOpacity onPress={handleRightIconPress}>
                        <Ionicons
                            name={effectiveRightIcon}
                            size={20}
                            color={activeColors.icon}
                        />
                    </TouchableOpacity>
                )}
            </ThemedView>

            {error && (
                <ThemedText size="xs" color="#FF3B30" style={styles.errorText}>
                    {error}
                </ThemedText>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    label: {
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        height: 56,
        borderRadius: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
        marginHorizontal: 8,
    },
    leftIcon: {
        marginRight: 4,
    },
    errorText: {
        marginTop: 4,
        marginLeft: 4,
    },
});
