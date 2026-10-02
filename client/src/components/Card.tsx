import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Animated,
  ViewStyle,
  StyleProp,
  View,
  Text,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'surface' | 'surfaceVariant' | 'surfaceMuted' | 'outline';
  enableHaptics?: boolean;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'surface',
  enableHaptics = false,
  testID,
}) => {
  const { colors, borderRadius, spacing, elevation } = useTheme();
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      speed: 24,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      stiffness: 300,
      damping: 15,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!onPress) return;
    if (enableHaptics && Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // ignore haptics
      }
    }
    onPress();
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'surfaceVariant':
      case 'surfaceMuted':
        return colors.surfaceMuted;
      case 'outline':
        return 'transparent';
      case 'surface':
      default:
        return colors.surface;
    }
  };

  const cardStyle = [
    styles.card,
    {
      backgroundColor: getBackgroundColor(),
      borderRadius: borderRadius.md,
      borderColor: colors.border,
      borderWidth: 1,
      padding: spacing.base,
    },
    variant === 'surface' ? elevation.card : {},
    style,
  ];

  const content = React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      if (!child.trim()) return null;
      return <Text style={{ color: colors.text }}>{child}</Text>;
    }
    return child;
  });

  if (!onPress) {
    return (
      <View testID={testID} style={cardStyle}>
        {content}
      </View>
    );
  }

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        cardStyle,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      {content}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
