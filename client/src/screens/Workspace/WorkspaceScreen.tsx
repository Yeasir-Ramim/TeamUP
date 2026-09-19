import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { api, ApiError } from '../../api/client';
import * as Haptics from 'expo-haptics';

interface WorkspaceMember {
  id: string;
  userId: string;
  userName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

interface WorkspaceProject {
  id: string;
  title: string;
  description: string;
  domain: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  members: WorkspaceMember[];
  stats: {
    totalTasks: number;
    completedTasks: number;
    todoTasks: number;
    inProgressTasks: number;
    unreadMessages: number;
    filesCount: number;
  };
}

interface WorkspaceScreenProps {
  route: { params: { projectId: string } };
  navigation: any;
}

export const WorkspaceScreen: React.FC<WorkspaceScreenProps> = ({ route, navigation }) => {
  const { projectId } = route.params;
  const { colors, typography, spacing } = useTheme();

  const [project, setProject] = useState<WorkspaceProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspace = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get<WorkspaceProject>(`/projects/${projectId}/workspace`);
      setProject(response);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load workspace');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWorkspace();
  };

  const navigateToKanban = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
    navigation.navigate('Kanban', { projectId });
  };

  const navigateToChat = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
    navigation.navigate('TeamChat', { projectId });
  };

  const navigateToFiles = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
    navigation.navigate('Files', { projectId });
  };

  const navigateToMembers = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    navigation.navigate('TeamMembers', { projectId });
  };

  const navigateToAnalytics = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
    navigation.navigate('Analytics', { projectId });
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          Loading workspace...
        </Text>
      </View>
    );
  }

  if (error || !project) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error || 'Failed to load workspace'}
        </Text>
        <Button title="Retry" onPress={fetchWorkspace} variant="filled" style={{ marginTop: spacing.md }} />
      </View>
    );
  }

  const taskCompletionPercent =
    project.stats.totalTasks > 0
      ? Math.round((project.stats.completedTasks / project.stats.totalTasks) * 100)
      : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.md }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Project Header */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Badge label={project.domain} variant="primary" style={{ marginRight: 6 }} />
            <Badge label={project.status} variant="secondary" />
          </View>
          <Text style={[styles.projectTitle, { color: colors.onSurface, ...typography.displayLarge }]}>
            {project.title}
          </Text>
          <Text
            style={[styles.projectDescription, { color: colors.onSurfaceVariant, ...typography.bodyMedium }]}
            numberOfLines={2}
          >
            {project.description}
          </Text>

          {/* Team Members Preview */}
          <TouchableOpacity style={styles.membersRow} onPress={navigateToMembers}>
            <Text style={[styles.membersText, { color: colors.onSurfaceVariant }]}>
              👥 {project.members.length} team member{project.members.length !== 1 ? 's' : ''}
            </Text>
            <Text style={{ fontSize: 16 }}>→</Text>
          </TouchableOpacity>
        </Card>

        {/* Task Progress Overview */}
        <Card style={styles.statsCard}>
          <Text style={[styles.cardTitle, { color: colors.onSurface, ...typography.titleMedium }]}>
            📊 Task Progress
          </Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: colors.primary, width: `${taskCompletionPercent}%` },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.onSurface }]}>
              {taskCompletionPercent}%
            </Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {project.stats.completedTasks}
              </Text>
              <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.secondary }]}>
                {project.stats.inProgressTasks}
              </Text>
              <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>In Progress</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.tertiary }]}>
                {project.stats.todoTasks}
              </Text>
              <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>To Do</Text>
            </View>
          </View>
          <Button
            title="View Full Analytics"
            onPress={navigateToAnalytics}
            variant="outline"
            style={{ marginTop: spacing.sm }}
          />
        </Card>

        {/* Quick Actions - Bento Grid */}
        <Text style={[styles.sectionTitle, { color: colors.onSurface, ...typography.headlineMedium }]}>
          Workspace Tools
        </Text>

        <View style={styles.bentoGrid}>
          {/* Kanban Board */}
          <TouchableOpacity
            style={[styles.bentoCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
            onPress={navigateToKanban}
            activeOpacity={0.8}
          >
            <Text style={styles.bentoIcon}>📋</Text>
            <Text style={[styles.bentoTitle, { color: colors.onSurface }]}>Kanban Board</Text>
            <Text style={[styles.bentoSubtitle, { color: colors.onSurfaceVariant }]}>
              {project.stats.totalTasks} tasks
            </Text>
          </TouchableOpacity>

          {/* Team Chat */}
          <TouchableOpacity
            style={[styles.bentoCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
            onPress={navigateToChat}
            activeOpacity={0.8}
          >
            <Text style={styles.bentoIcon}>💬</Text>
            <Text style={[styles.bentoTitle, { color: colors.onSurface }]}>Team Chat</Text>
            {project.stats.unreadMessages > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={[styles.badgeText, { color: colors.onError }]}>
                  {project.stats.unreadMessages}
                </Text>
              </View>
            )}
            <Text style={[styles.bentoSubtitle, { color: colors.onSurfaceVariant }]}>
              {project.stats.unreadMessages > 0 ? `${project.stats.unreadMessages} unread` : 'No new messages'}
            </Text>
          </TouchableOpacity>

          {/* File Sharing */}
          <TouchableOpacity
            style={[styles.bentoCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
            onPress={navigateToFiles}
            activeOpacity={0.8}
          >
            <Text style={styles.bentoIcon}>📁</Text>
            <Text style={[styles.bentoTitle, { color: colors.onSurface }]}>Files</Text>
            <Text style={[styles.bentoSubtitle, { color: colors.onSurfaceVariant }]}>
              {project.stats.filesCount} file{project.stats.filesCount !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>

          {/* Analytics */}
          <TouchableOpacity
            style={[styles.bentoCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
            onPress={navigateToAnalytics}
            activeOpacity={0.8}
          >
            <Text style={styles.bentoIcon}>📈</Text>
            <Text style={[styles.bentoTitle, { color: colors.onSurface }]}>Analytics</Text>
            <Text style={[styles.bentoSubtitle, { color: colors.onSurfaceVariant }]}>Team insights</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerCard: {
    padding: 20,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  projectDescription: {
    lineHeight: 20,
    marginBottom: 12,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  membersText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsCard: {
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '700',
    minWidth: 48,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  bentoCard: {
    width: '48%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  bentoTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  bentoSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
