import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

export type StateViewType = 'empty' | 'error' | 'success';

interface StateViewProps {
    type: StateViewType;
    title?: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
    style?: ViewStyle;
}

export function StateView({
    type,
    title,
    message,
    actionLabel,
    onAction,
    style,
}: StateViewProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    let iconName: keyof typeof Ionicons.glyphMap;
    let iconColor: string;
    let defaultTitle: string;

    switch (type) {
        case 'empty':
            iconName = 'file-tray-outline';
            iconColor = theme.icon;
            defaultTitle = 'No data available';
            break;
        case 'error':
            iconName = 'alert-circle-outline';
            iconColor = '#FF3B30'; // Red
            defaultTitle = 'Something went wrong';
            break;
        case 'success':
            iconName = 'checkmark-circle-outline';
            iconColor = '#34C759'; // Green
            defaultTitle = 'Action completed successfully';
            break;
    }

    return (
        <ThemedView style={[styles.container, style]} align="center" justify="center">
            <Ionicons name={iconName} size={64} color={iconColor} style={styles.icon} />

            <ThemedText size="xl" weight="bold" align="center" style={styles.title}>
                {title || defaultTitle}
            </ThemedText>

            {message && (
                <ThemedText size="md" color={theme.icon} align="center" style={styles.message}>
                    {message}
                </ThemedText>
            )}

            {actionLabel && onAction && (
                <ThemedButton
                    onPress={onAction}
                    variant="solid"
                    style={styles.button}
                >
                    <ThemedText weight="medium" style={{ color: '#FFFFFF' }}>{actionLabel}</ThemedText>
                </ThemedButton>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        flex: 1,
    },
    icon: {
        marginBottom: 16,
    },
    title: {
        marginBottom: 8,
    },
    message: {
        marginBottom: 24,
    },
    button: {
        minWidth: 120,
    },
});
