import { api } from '../api/client';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface GetNotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export const notificationService = {
  /**
   * Get all notifications for the logged in user
   */
  getNotifications: async (): Promise<GetNotificationsResponse> => {
    try {
      const res = await api.get<GetNotificationsResponse>('/notifications');
      return res || { notifications: [], unreadCount: 0 };
    } catch {
      // Fallback empty list if error
      return { notifications: [], unreadCount: 0 };
    }
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (notificationId: string): Promise<AppNotification | null> => {
    return api.patch<AppNotification>(`/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ success: boolean }> => {
    return api.patch<{ success: boolean }>('/notifications/read-all');
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (notificationId: string): Promise<{ success: boolean }> => {
    return api.delete<{ success: boolean }>(`/notifications/${notificationId}`);
  },

  /**
   * Register push token with backend
   */
  registerPushToken: async (pushToken?: string): Promise<{ registered: boolean }> => {
    return api.post<{ registered: boolean }>('/notifications/push-token', { pushToken });
  },

  /**
   * Deregister push token with backend
   */
  deregisterPushToken: async (): Promise<{ registered: boolean }> => {
    return api.post<{ registered: boolean }>('/notifications/push-token', { pushToken: '' });
  },
};
