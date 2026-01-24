import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { StyleProps, useStyleProps } from '@/utils/style-props';

export type ThemedViewProps = ViewProps & StyleProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  lightColor,
  darkColor,
  style,
  ...props
}: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const { style: extractedStyle, rest } = useStyleProps(props);

  return (
    <View
      style={[
        { backgroundColor },
        extractedStyle,
        style
      ]}
      {...rest}
    />
  );
}
