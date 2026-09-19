import { api } from '../api/client';
import { Task, TaskStatus, TaskPriority } from '../screens/Kanban/KanbanScreen';

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
}

export const kanbanService = {
  /**
   * Get all tasks for a project
   */
  getTasks: (projectId: string): Promise<Task[]> => {
    return api.get<Task[]>(`/projects/${projectId}/tasks`);
  },

  /**
   * Get a single task by ID
   */
  getTask: (taskId: string): Promise<Task> => {
    return api.get<Task>(`/tasks/${taskId}`);
  },

  /**
   * Create a new task
   */
  createTask: (projectId: string, payload: CreateTaskPayload): Promise<Task> => {
    return api.post<Task>(`/projects/${projectId}/tasks`, payload);
  },

  /**
   * Update task (status, assignee, etc.)
   */
  updateTask: (taskId: string, payload: UpdateTaskPayload): Promise<Task> => {
    return api.patch<Task>(`/tasks/${taskId}`, payload);
  },

  /**
   * Delete a task
   */
  deleteTask: (taskId: string): Promise<void> => {
    return api.delete<void>(`/tasks/${taskId}`);
  },

  /**
   * Assign task to a user
   */
  assignTask: (taskId: string, userId: string): Promise<void> => {
    return api.patch<void>(`/tasks/${taskId}`, { assigneeId: userId });
  },

  /**
   * Move task to a different status
   */
  moveTask: (taskId: string, newStatus: TaskStatus): Promise<void> => {
    return api.patch<void>(`/tasks/${taskId}`, { status: newStatus });
  },
};
