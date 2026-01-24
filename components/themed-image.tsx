import { Image, type ImageProps } from 'expo-image';
import { ImageStyle, StyleProp, StyleSheet } from 'react-native';

import { StyleProps, useStyleProps } from '@/utils/style-props';

export type ThemedImageProps = ImageProps & StyleProps & {
    lightColor?: string;
    darkColor?: string;
    variant?: 'default' | 'rounded' | 'circle' | 'square';
    size?: number; // Optional shorthand for width/height
};

export function ThemedImage({
    style,
    lightColor,
    darkColor,
    variant = 'default',
    size,
    ...props
}: ThemedImageProps) {
    // We can use theme color for placeholder or border if needed, 
    // currently just placeholder for structure flexibility.
    // const borderColor = useThemeColor({ light: lightColor, dark: darkColor }, 'border');

    const sizeStyle: StyleProp<ImageStyle> = size ? { width: size, height: size } : {};
    const { style: extractedStyle, rest } = useStyleProps(props);

    return (
        <Image
            style={[
                variant === 'rounded' && styles.rounded,
                variant === 'circle' && styles.circle,
                // If circle, we expect square dimensions usually, border radius is handled by style or calculated
                // but explicit borderRadius: 9999 works for circles if width/height match.
                sizeStyle,
                extractedStyle,
                style,
            ]}
            {...rest}
        />
    );
}

const styles = StyleSheet.create({
    rounded: {
        borderRadius: 8,
    },
    circle: {
        borderRadius: 9999,
    },
    square: {
        borderRadius: 0,
    },
});
