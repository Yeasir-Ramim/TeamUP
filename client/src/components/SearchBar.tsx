import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Search, X, SlidersHorizontal } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing?: () => void;
  onClear?: () => void;
  onFilterPress?: () => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSubmitEditing,
  onClear,
  onFilterPress,
  placeholder = 'Search projects by title, domain, tech...',
  style,
  testID,
  autoFocus = false,
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.border,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.md,
        },
        style,
      ]}
    >
      <Search size={16} color={colors.textMuted} style={styles.searchIcon} />

      <TextInput
        testID={testID}
        style={[
          styles.input,
          {
            color: colors.text,
            fontSize: typography.body.fontSize,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        returnKeyType="search"
        autoFocus={autoFocus}
        accessible={true}
        accessibilityLabel="Search input"
      />

      {value.length > 0 && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => {
            onChangeText('');
            if (onClear) onClear();
          }}
          style={styles.clearBtn}
        >
          <X size={14} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      {onFilterPress && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Filters"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={onFilterPress}
          style={[styles.filterBtn, { borderLeftColor: colors.border }]}
        >
          <SlidersHorizontal size={15} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 46,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterBtn: {
    paddingLeft: 10,
    marginLeft: 6,
    borderLeftWidth: 1,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
