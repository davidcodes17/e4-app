import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { StyleProps, useStyleProps } from '@/utils/style-props';

export type ThemedTextProps = TextProps & StyleProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'label' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'regular' | 'medium' | 'bold';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  variant = 'default',
  size = 'md',
  weight = 'regular',
  ...props
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, variant === 'link' ? 'tint' : 'text');
  const { style: extractedStyle, rest } = useStyleProps(props);

  return (
    <Text
      style={[
        { color },
        weightStyles[weight],
        sizeStyles[size],
        variant === 'link' && styles.link,
        extractedStyle,
        style,
      ]}
      {...rest}
    />
  );
}

const sizeStyles = StyleSheet.create({
  xs: { fontSize: 12, lineHeight: 18 },
  sm: { fontSize: 14, lineHeight: 22 },
  md: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 18, lineHeight: 26 },
  xl: { fontSize: 20, lineHeight: 28 },
  '2xl': { fontSize: 24, lineHeight: 32 },
  '3xl': { fontSize: 30, lineHeight: 36 },
  '4xl': { fontSize: 36, lineHeight: 42 },
});

const weightStyles = StyleSheet.create({
  regular: { fontFamily: 'PlusJakartaSans-Regular' },
  medium: { fontFamily: 'PlusJakartaSans-Medium' },
  bold: { fontFamily: 'PlusJakartaSans-Bold' },
});

const styles = StyleSheet.create({
  link: {
    textDecorationLine: 'underline',
  },
});
