import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export interface BadgeProps {
  label: string | number;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'warning' | 'accent';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  style,
  textStyle,
}) => {
  const { colors, typography, borderRadius, spacing } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'secondary':
        return colors.surfaceMuted;
      case 'tertiary':
      case 'accent':
        return colors.surfaceMuted;
      case 'warning':
        return '#78350F';
      case 'error':
        return colors.errorContainer;
      case 'primary':
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'secondary':
      case 'tertiary':
      case 'accent':
        return colors.text;
      case 'warning':
        return '#FDE68A';
      case 'error':
        return colors.onErrorContainer;
      case 'primary':
      default:
        return colors.onPrimary;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'secondary':
      case 'tertiary':
      case 'accent':
        return colors.border;
      case 'warning':
        return '#B45309';
      case 'error':
        return colors.error;
      case 'primary':
      default:
        return colors.primary;
    }
  };

  return (
    <View
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={String(label)}
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: 1,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: 3,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: typography.label.fontSize,
            fontWeight: '600',
            letterSpacing: 0.2,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
});