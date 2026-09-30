import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
  Platform,
  ViewStyle,
  StyleProp,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';

export interface SegmentedControlProps {
  options: string[];
  selectedOption: string;
  onSelectOption: (option: string) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedOption,
  onSelectOption,
  style,
  testID,
}) => {
  const { colors, typography, borderRadius } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const selectedIndex = Math.max(0, options.indexOf(selectedOption));
  const segmentWidth = containerWidth > 0 ? (containerWidth - 6) / options.length : 0;

  useEffect(() => {
    if (segmentWidth > 0) {
      Animated.spring(translateX, {
        toValue: selectedIndex * segmentWidth,
        useNativeDriver: true,
        bounciness: 2,
        speed: 18,
      }).start();
    }
  }, [selectedIndex, segmentWidth, translateX]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  const handlePress = (option: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.selectionAsync();
      } catch {
        // ignore haptics failure on unsupported platforms
      }
    }
    onSelectOption(option);
  };

  return (
    <View
      testID={testID}
      onLayout={handleLayout}
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.border,
          borderRadius: borderRadius.md,
        },
        style,
      ]}
    >
      {segmentWidth > 0 && (
        <Animated.View
          style={[
            styles.slider,
            {
              width: segmentWidth,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: Math.max(borderRadius.sm, 4),
              transform: [{ translateX }],
              ...Platform.select({
                web: {
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
                },
                default: {
                  elevation: 2,
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                },
              }),
            },
          ]}
        />
      )}

      {options.map((option) => {
        const isSelected = option === selectedOption;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option}
            onPress={() => handlePress(option)}
            style={styles.segment}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color: isSelected ? colors.text : colors.textMuted,
                  fontWeight: isSelected ? '600' : '500',
                  fontSize: typography.bodySmall.fontSize,
                },
              ]}
              numberOfLines={1}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderWidth: 1,
    height: 38,
    position: 'relative',
  },
  slider: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    paddingHorizontal: 4,
  },
  segmentText: {
    textAlign: 'center',
  },
});
