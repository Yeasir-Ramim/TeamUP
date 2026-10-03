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
      const res = await api.get<any>('/notifications');
      let notifications: AppNotification[] = [];
      let unreadCount = 0;

      if (Array.isArray(res)) {
        notifications = res;
      } else if (res && Array.isArray(res.notifications)) {
        notifications = res.notifications;
      }

      if (typeof res?.unreadCount === 'number') {
        unreadCount = res.unreadCount;
      } else {
        try {
          const countRes = await api.get<{ unreadCount: number }>('/notifications/unread-count');
          unreadCount = countRes?.unreadCount ?? notifications.filter((n) => !n.isRead).length;
        } catch {
          unreadCount = notifications.filter((n) => !n.isRead).length;
        }
      }

      return { notifications, unreadCount };
    } catch {
      // Fallback empty list if error
      return { notifications: [], unreadCount: 0 };
    }
  },

  /**
   * Get total unread count for badges
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      const res = await api.get<{ unreadCount: number }>('/notifications/unread-count');
      return res?.unreadCount ?? 0;
    } catch {
      return 0;
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
    if (!pushToken) return { registered: false };
    return api.post<{ registered: boolean }>('/notifications/push-token', {
      token: pushToken,
      pushToken,
      device: 'web',
    });
  },

  /**
   * Deregister push token with backend
   */
  deregisterPushToken: async (pushToken?: string): Promise<{ registered: boolean }> => {
    if (!pushToken) return { registered: false };
    return api.delete<{ registered: boolean }>('/notifications/push-token', {
      token: pushToken,
    });
  },
};
