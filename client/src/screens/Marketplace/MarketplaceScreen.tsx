import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ProjectCard, ProjectListing } from '../../components/ProjectCard';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { api, ApiError } from '../../api/client';
import * as Haptics from 'expo-haptics';

type ProjectStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';

interface MarketplaceFilters {
  search?: string;
  domain?: string;
  techStack?: string[];
  status?: ProjectStatus;
  semester?: string;
}

export const MarketplaceScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography, spacing } = useTheme();

  const [projects, setProjects] = useState<ProjectListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  // Available filter options
  const domains = ['Mobile', 'Web', 'AI/ML', 'IoT', 'Blockchain', 'Game Dev', 'DevOps'];
  const statuses: ProjectStatus[] = ['OPEN', 'IN_PROGRESS', 'COMPLETED'];

  const fetchProjects = useCallback(async () => {
    try {
      setError(null);
      const params: any = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedDomain) params.domain = selectedDomain;
      if (selectedStatus) params.status = selectedStatus;

      const response = await api.get<ProjectListing[]>('/projects/search', params);
      setProjects(response);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load projects');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedDomain, selectedStatus]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const handleClearFilters = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setSearchQuery('');
    setSelectedDomain(undefined);
    setSelectedStatus(undefined);
  };

  const handleProjectPress = (project: ProjectListing) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
    navigation.navigate('ProjectDetails', { projectId: project.id });
  };

  const handleBookmarkToggle = async (projectId: string) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const isBookmarked = project.isBookmarked;
      
      // Optimistic update
      setProjects(prev =>
        prev.map(p => (p.id === projectId ? { ...p, isBookmarked: !isBookmarked } : p))
      );

      if (isBookmarked) {
        await api.delete(`/bookmarks/project/${projectId}`);
      } else {
        await api.post('/bookmarks/project', { projectId });
      }
    } catch (err) {
      // Revert on error
      setProjects(prev =>
        prev.map(p => (p.id === projectId ? { ...p, isBookmarked: !p.isBookmarked } : p))
      );
    }
  };

  const toggleFilters = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setShowFilters(!showFilters);
  };

  const renderFilters = () => (
    <View style={[styles.filterPanel, { backgroundColor: colors.surfaceVariant }]}>
      {/* Domain Filter */}
      <Text style={[styles.filterLabel, { color: colors.onSurface, ...typography.titleMedium }]}>
        Domain
      </Text>
      <View style={styles.chipRow}>
        {domains.map(domain => (
          <Chip
            key={domain}
            label={domain}
            selected={selectedDomain === domain}
            onPress={() => {
              if (Platform.OS !== 'web') {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
              }
              setSelectedDomain(selectedDomain === domain ? undefined : domain);
            }}
            variant="primary"
          />
        ))}
      </View>

      {/* Status Filter */}
      <Text style={[styles.filterLabel, { color: colors.onSurface, ...typography.titleMedium, marginTop: spacing.md }]}>
        Status
      </Text>
      <View style={styles.chipRow}>
        {statuses.map(status => (
          <Chip
            key={status}
            label={status}
            selected={selectedStatus === status}
            onPress={() => {
              if (Platform.OS !== 'web') {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
              }
              setSelectedStatus(selectedStatus === status ? undefined : status);
            }}
            variant="secondary"
          />
        ))}
      </View>

      <Button
        title="Clear Filters"
        onPress={handleClearFilters}
        variant="outline"
        style={{ marginTop: spacing.md }}
      />
    </View>
  );

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Loading projects...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorIcon]}>⚠️</Text>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <Button title="Retry" onPress={fetchProjects} variant="filled" style={{ marginTop: spacing.md }} />
        </View>
      );
    }

    if (projects.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyIcon]}>📦</Text>
          <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            No projects found
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.onSurfaceVariant }]}>
            Try adjusting your filters or create a new project
          </Text>
          <Button
            title="Create Project"
            onPress={() => navigation.navigate('CreateProject')}
            variant="filled"
            style={{ marginTop: spacing.md }}
          />
        </View>
      );
    }

    return (
      <>
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onPress={() => handleProjectPress(project)}
            onBookmarkToggle={handleBookmarkToggle}
          />
        ))}
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <Text style={[styles.headerTitle, { color: colors.onSurface, ...typography.headlineMedium }]}>
          Project Marketplace
        </Text>
        <Button
          title="Create Project"
          onPress={() => navigation.navigate('CreateProject')}
          variant="filled"
          style={{ marginTop: spacing.sm }}
        />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.surfaceVariant,
              color: colors.onSurface,
              borderColor: colors.outlineVariant,
            },
          ]}
          placeholder="Search projects..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: showFilters ? colors.primaryContainer : colors.surfaceVariant,
              borderColor: colors.outlineVariant,
            },
          ]}
          onPress={toggleFilters}
        >
          <Text style={{ fontSize: 20 }}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Panel */}
      {showFilters && renderFilters()}

      {/* Project List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.md }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
  },
  filterPanel: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  filterLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
