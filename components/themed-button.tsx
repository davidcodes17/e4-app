import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { StyleProps, useStyleProps } from '@/utils/style-props';
import { ThemedText } from './themed-text';

export type ThemedButtonProps = TouchableOpacityProps & StyleProps & {
    lightColor?: string;
    darkColor?: string;
    variant?: 'solid' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    children?: React.ReactNode;
    text?: string;
};

export function ThemedButton({
    style,
    lightColor,
    darkColor,
    variant = 'solid',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    text,
    disabled,
    ...props
}: ThemedButtonProps) {
    const primaryColor = useThemeColor({ light: lightColor, dark: darkColor }, 'tint');
    const textColor = variant === 'solid' ? '#FFFFFF' : primaryColor;
    const borderColor = primaryColor;

    const opacity = disabled || isLoading ? 0.7 : 1;
    const { style: extractedStyle, rest } = useStyleProps(props);

    return (
        <TouchableOpacity
            style={[
                styles.base,
                sizeStyles[size],
                variant === 'solid' && { backgroundColor: primaryColor },
                variant === 'outline' && { borderWidth: 1, borderColor: borderColor, backgroundColor: 'transparent' },
                variant === 'ghost' && { backgroundColor: 'transparent' },
                { opacity },
                extractedStyle,
                style,
            ]}
            disabled={disabled || isLoading}
            activeOpacity={0.8}
            {...rest}
        >
            {isLoading ? (
                <ActivityIndicator color={textColor} size="small" />
            ) : (
                <>
                    {leftIcon && <Ionicons name={leftIcon} size={iconSizes[size]} color={textColor} style={{ marginRight: 8 }} />}

                    {text ? (
                        <ThemedText
                            weight="medium"
                            style={{ color: textColor, fontSize: fontSizes[size] }}
                        >
                            {text}
                        </ThemedText>
                    ) : (
                        children
                    )}

                    {rightIcon && <Ionicons name={rightIcon} size={iconSizes[size]} color={textColor} style={{ marginLeft: 8 }} />}
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
});

const sizeStyles = StyleSheet.create({
    sm: {
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    md: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    lg: {
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
});

const fontSizes = {
    sm: 14,
    md: 16,
    lg: 18,
};

const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
};
