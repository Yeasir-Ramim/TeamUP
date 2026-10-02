import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export type WorkspaceTabKey =
  | 'Overview'
  | 'Tasks'
  | 'Chat'
  | 'Team'
  | 'Files'
  | 'Analytics';

export interface WorkspaceTabBarProps {
  activeTab: WorkspaceTabKey;
  projectId: string;
  projectTitle?: string;
  navigation: any;
  isLeader?: boolean;
}

interface TabDef {
  key: WorkspaceTabKey;
  label: string;
  routeName: string;
}

const TABS: TabDef[] = [
  { key: 'Overview', label: 'Overview', routeName: 'WorkspaceHome' },
  { key: 'Tasks', label: 'Tasks', routeName: 'Kanban' },
  { key: 'Chat', label: 'Chat', routeName: 'Chat' },
  { key: 'Team', label: 'Team', routeName: 'Members' },
  { key: 'Files', label: 'Files', routeName: 'Files' },
  { key: 'Analytics', label: 'Analytics', routeName: 'Analytics' },
];

export const WorkspaceTabBar: React.FC<WorkspaceTabBarProps> = ({
  activeTab,
  projectId,
  projectTitle,
  navigation,
  isLeader,
}) => {
  const { colors, typography } = useTheme();

  const handleTabPress = (tab: TabDef) => {
    if (tab.key === activeTab) {
      return;
    }

    navigation?.navigate(tab.routeName, {
      projectId,
      projectTitle,
      isLeader,
    });
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              style={[
                styles.tabItem,
                isActive && {
                  borderBottomColor: colors.primary,
                  borderBottomWidth: 2.5,
                },
              ]}
              onPress={() => handleTabPress(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  typography.body,
                  styles.tabText,
                  {
                    color: isActive ? colors.primary : colors.textMuted,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    zIndex: 10,
  },
  scrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
  },
});
