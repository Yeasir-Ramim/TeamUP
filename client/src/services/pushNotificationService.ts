import { notificationService } from './notificationService';

export const pushNotificationService = {
  /**
   * Get or register Expo push token for the current user session
   */
  registerDevicePushToken: async (customToken?: string): Promise<string | null> => {
    try {
      const pushToken = customToken || 'ExponentPushToken[mock-device-token-teamup-2026]';
      await notificationService.registerPushToken(pushToken);
      return pushToken;
    } catch {
      return null;
    }
  },

  /**
   * Deregister device push token on logout
   */
  deregisterDevicePushToken: async (): Promise<boolean> => {
    try {
      await notificationService.deregisterPushToken();
      return true;
    } catch {
      return false;
    }
  },
};
