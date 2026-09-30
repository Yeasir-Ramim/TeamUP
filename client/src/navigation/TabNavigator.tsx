import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FolderKanban, Users, Plus, Lightbulb, Menu } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

import { MarketplaceScreen } from '../screens/Marketplace/MarketplaceScreen';
import { MatchingScreen } from '../screens/Matching/MatchingScreen';
import { CreateProjectScreen } from '../screens/Marketplace/CreateProjectScreen';
import { IdeaHubScreen } from '../screens/IdeaHub/IdeaHubScreen';
import { MoreScreen } from '../screens/More/MoreScreen';

export type MainTabParamList = {
  Projects: undefined;
  Matching: undefined;
  Create: undefined;
  IdeaHub: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#09090B' : '#FFFFFF',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 56 + Math.max(insets.bottom, 6),
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 6,
          paddingHorizontal: 8,
          ...Platform.select({
            web: {
              borderTopWidth: 1,
              boxShadow: isDark
                ? '0 -1px 0 0 rgba(255, 255, 255, 0.08)'
                : '0 -1px 0 0 rgba(0, 0, 0, 0.08)',
            },
            default: {
              elevation: 4,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: -1 },
              shadowOpacity: isDark ? 0.3 : 0.05,
              shadowRadius: 4,
            },
          }),
        },
        tabBarActiveBackgroundColor: isDark
          ? 'rgba(255, 255, 255, 0.06)'
          : 'rgba(0, 0, 0, 0.04)',
        tabBarItemStyle: {
          borderRadius: 8,
          marginHorizontal: 4,
          marginVertical: 2,
          paddingVertical: 3,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Projects"
        component={MarketplaceScreen}
        options={{
          title: 'Projects',
          tabBarIcon: ({ color }) => <FolderKanban size={18} color={color} />,
        }}
      />
      <Tab.Screen
        name="Matching"
        component={MatchingScreen}
        options={{
          title: 'Matching',
          tabBarIcon: ({ color }) => <Users size={18} color={color} />,
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateProjectScreen}
        options={{
          title: 'Create',
          tabBarLabel: () => null,
          tabBarActiveBackgroundColor: 'transparent',
          tabBarItemStyle: {
            borderRadius: 0,
            marginHorizontal: 0,
            marginVertical: 0,
          },
          tabBarIcon: () => (
            <View
              style={[
                styles.createButton,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Plus size={20} color={colors.onPrimary} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="IdeaHub"
        component={IdeaHubScreen}
        options={{
          title: 'Ideas',
          tabBarIcon: ({ color }) => <Lightbulb size={18} color={color} />,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <Menu size={18} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 12 : 8,
  },
});
