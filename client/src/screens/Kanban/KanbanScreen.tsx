import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { api, ApiError } from '../../api/client';
import * as Haptics from 'expo-haptics';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'TESTING' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface KanbanScreenProps {
  route: { params: { projectId: string } };
  navigation: any;
}

export const KanbanScreen: React.FC<KanbanScreenProps> = ({ route, navigation }) => {
  const { projectId } = route.params;
  const { colors, typography, spacing } = useTheme();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const columns: { status: TaskStatus; title: string; emoji: string }[] = [
    { status: 'TODO', title: 'To Do', emoji: '📝' },
    { status: 'IN_PROGRESS', title: 'In Progress', emoji: '⚙️' },
    { status: 'TESTING', title: 'Testing', emoji: '🧪' },
    { status: 'DONE', title: 'Done', emoji: '✅' },
  ];

  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get<Task[]>(`/projects/${projectId}/tasks`);
      setTasks(response);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleTaskPress = (task: Task) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setSelectedTask(task);
  };

  const handleMoveTask = async (taskId: string, newStatus: TaskStatus) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }

    // Optimistic update
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t)));

    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
    } catch (err) {
      // Revert on error
      fetchTasks();
    }
  };

  const handleCreateTask = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
    setCreateModalVisible(true);
  };

  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case 'LOW':
        return colors.tertiary;
      case 'MEDIUM':
        return colors.secondary;
      case 'HIGH':
        return colors.primary;
      case 'URGENT':
        return colors.error;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const renderTaskCard = (task: Task) => (
    <TouchableOpacity key={task.id} onPress={() => handleTaskPress(task)}>
      <Card style={[styles.taskCard, { backgroundColor: colors.surface }]}>
        <View style={styles.taskHeader}>
          <Badge
            label={task.priority}
            variant="primary"
            style={{ backgroundColor: getPriorityColor(task.priority) }}
          />
          {task.assigneeName && (
            <Text style={[styles.assigneeText, { color: colors.onSurfaceVariant }]}>
              👤 {task.assigneeName}
            </Text>
          )}
        </View>
        <Text style={[styles.taskTitle, { color: colors.onSurface, ...typography.titleMedium }]}>
          {task.title}
        </Text>
        {task.description && (
          <Text
            style={[styles.taskDescription, { color: colors.onSurfaceVariant, ...typography.bodyMedium }]}
            numberOfLines={2}
          >
            {task.description}
          </Text>
        )}
        {task.dueDate && (
          <Text style={[styles.dueDateText, { color: colors.onSurfaceVariant }]}>
            📅 Due: {new Date(task.dueDate).toLocaleDateString()}
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );

  const renderColumn = (column: { status: TaskStatus; title: string; emoji: string }) => {
    const columnTasks = tasks.filter(t => t.status === column.status);

    return (
      <View key={column.status} style={[styles.column, { backgroundColor: colors.surfaceVariant }]}>
        <View style={styles.columnHeader}>
          <Text style={[styles.columnTitle, { color: colors.onSurface }]}>
            {column.emoji} {column.title}
          </Text>
          <Badge label={columnTasks.length.toString()} variant="secondary" />
        </View>
        <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
          {columnTasks.map(renderTaskCard)}
          {columnTasks.length === 0 && (
            <Text style={[styles.emptyColumnText, { color: colors.onSurfaceVariant }]}>
              No tasks
            </Text>
          )}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          Loading Kanban board...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <Button title="Retry" onPress={fetchTasks} variant="filled" style={{ marginTop: spacing.md }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <Text style={[styles.headerTitle, { color: colors.onSurface, ...typography.headlineMedium }]}>
          Kanban Board
        </Text>
        <Button
          title="+ Create Task"
          onPress={handleCreateTask}
          variant="filled"
          style={{ marginTop: spacing.sm }}
        />
      </View>

      {/* Kanban Board */}
      <ScrollView
        horizontal
        style={styles.boardScroll}
        contentContainerStyle={styles.boardContent}
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {columns.map(renderColumn)}
      </ScrollView>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          visible={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onMove={handleMoveTask}
          onRefresh={fetchTasks}
          colors={colors}
          typography={typography}
          spacing={spacing}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        projectId={projectId}
        onSuccess={fetchTasks}
        colors={colors}
        typography={typography}
        spacing={spacing}
      />
    </View>
  );
};

// Task Detail Modal Component
const TaskDetailModal: React.FC<{
  task: Task;
  visible: boolean;
  onClose: () => void;
  onMove: (taskId: string, newStatus: TaskStatus) => void;
  onRefresh: () => void;
  colors: any;
  typography: any;
  spacing: any;
}> = ({ task, visible, onClose, onMove, onRefresh, colors, typography, spacing }) => {
  const statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'TESTING', 'DONE'];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.onSurface, ...typography.headlineMedium }]}>
              Task Details
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 24, color: colors.onSurfaceVariant }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <Badge label={task.priority} variant="primary" style={{ alignSelf: 'flex-start' }} />
            <Text style={[styles.taskDetailTitle, { color: colors.onSurface, ...typography.titleMedium }]}>
              {task.title}
            </Text>
            {task.description && (
              <Text style={[styles.taskDetailDescription, { color: colors.onSurfaceVariant }]}>
                {task.description}
              </Text>
            )}
            {task.assigneeName && (
              <Text style={[styles.taskDetailMeta, { color: colors.onSurfaceVariant }]}>
                👤 Assigned to: {task.assigneeName}
              </Text>
            )}
            {task.dueDate && (
              <Text style={[styles.taskDetailMeta, { color: colors.onSurfaceVariant }]}>
                📅 Due: {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            )}

            <Text style={[styles.moveLabel, { color: colors.onSurface, ...typography.titleMedium }]}>
              Move to:
            </Text>
            <View style={styles.statusChips}>
              {statuses.map(status => (
                <Chip
                  key={status}
                  label={status.replace('_', ' ')}
                  selected={task.status === status}
                  onPress={() => {
                    onMove(task.id, status);
                    onClose();
                  }}
                  variant="primary"
                />
              ))}
            </View>
          </ScrollView>

          <Button title="Close" onPress={onClose} variant="outline" style={{ marginTop: spacing.md }} />
        </View>
      </View>
    </Modal>
  );
};

// Create Task Modal Component
const CreateTaskModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
  colors: any;
  typography: any;
  spacing: any;
}> = ({ visible, onClose, projectId, onSuccess, colors, typography, spacing }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priorities: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post(`/projects/${projectId}/tasks`, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status: 'TODO',
      });

      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }

      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      onSuccess();
      onClose();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.onSurface, ...typography.headlineMedium }]}>
              Create New Task
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 24, color: colors.onSurfaceVariant }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Title *</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surfaceVariant,
                  color: colors.onSurface,
                  borderColor: colors.outlineVariant,
                },
              ]}
              placeholder="Task title..."
              placeholderTextColor={colors.onSurfaceVariant}
              value={title}
              onChangeText={setTitle}
              editable={!loading}
            />

            <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Description</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                {
                  backgroundColor: colors.surfaceVariant,
                  color: colors.onSurface,
                  borderColor: colors.outlineVariant,
                },
              ]}
              placeholder="Task description..."
              placeholderTextColor={colors.onSurfaceVariant}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />

            <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Priority</Text>
            <View style={styles.statusChips}>
              {priorities.map(p => (
                <Chip
                  key={p}
                  label={p}
                  selected={priority === p}
                  onPress={() => setPriority(p)}
                  variant="secondary"
                />
              ))}
            </View>

            {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
          </ScrollView>

          <Button
            title={loading ? 'Creating...' : 'Create Task'}
            onPress={handleCreate}
            variant="filled"
            disabled={loading}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </View>
    </Modal>
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
  boardScroll: {
    flex: 1,
  },
  boardContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  column: {
    width: 280,
    marginHorizontal: 6,
    borderRadius: 16,
    padding: 12,
    maxHeight: '100%',
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  columnScroll: {
    flex: 1,
  },
  emptyColumnText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  taskCard: {
    padding: 12,
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assigneeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    marginBottom: 8,
    lineHeight: 18,
  },
  dueDateText: {
    fontSize: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: '700',
  },
  modalScroll: {
    maxHeight: 400,
  },
  taskDetailTitle: {
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  taskDetailDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  taskDetailMeta: {
    fontSize: 14,
    marginBottom: 8,
  },
  moveLabel: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  statusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
});
