import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { StyleProps, useStyleProps } from '@/utils/style-props';

export type ThemedViewProps = ViewProps & StyleProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'card' | 'outlined';
  layout?: 'center' | 'stack' | 'row' | 'stretch';
};

export function ThemedView({
  lightColor,
  darkColor,
  variant,
  layout,
  style,
  ...props
}: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const { style: extractedStyle, rest } = useStyleProps(props);

  const variantStyles: any = {
    card: {
      backgroundColor: useThemeColor({}, 'card'),
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    outlined: {
      borderWidth: 1,
      borderColor: useThemeColor({}, 'border'),
      borderRadius: 16,
      padding: 16,
    }
  };

  const layoutStyles: any = {
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    stack: {
      flexDirection: 'column',
    },
    stretch: {
      alignItems: 'stretch',
    }
  };

  return (
    <View
      style={[
        { backgroundColor },
        variant && variantStyles[variant],
        layout && layoutStyles[layout],
        extractedStyle,
        style
      ]}
      {...rest}
    />
  );
}
