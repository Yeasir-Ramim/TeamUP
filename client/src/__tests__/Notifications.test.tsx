import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NotificationsScreen } from '../screens/Notifications/NotificationsScreen';
import { ThemeProvider } from '../theme/ThemeContext';
import { notificationService, AppNotification } from '../services/notificationService';
import { pushNotificationService } from '../services/pushNotificationService';
import * as Haptics from 'expo-haptics';

jest.mock('../api/client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

const mockNavigation = {
  navigate: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

describe('Notifications (Phase 7 - Feature 15)', () => {
  jest.setTimeout(15000);
  const mockNotifications: AppNotification[] = [
    {
      id: 'notif-1',
      userId: 'usr-1',
      title: 'New Team Invitation',
      body: 'Alex invited you to join EduTech Platform.',
      type: 'MATCH_INVITE',
      isRead: false,
      createdAt: new Date().toISOString(),
      data: { screen: 'Matching' },
    },
    {
      id: 'notif-2',
      userId: 'usr-1',
      title: 'Meeting Scheduled',
      body: 'Sprint planning set for tomorrow 10 AM.',
      type: 'MEETING_SCHEDULER',
      isRead: true,
      createdAt: new Date().toISOString(),
      data: { screen: 'Scheduler' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers push token on login and deregisters on logout', async () => {
    const registerSpy = jest
      .spyOn(notificationService, 'registerPushToken')
      .mockResolvedValueOnce({ registered: true });

    const deregisterSpy = jest
      .spyOn(notificationService, 'deregisterPushToken')
      .mockResolvedValueOnce({ registered: false });

    await pushNotificationService.registerDevicePushToken('test-token');
    expect(registerSpy).toHaveBeenCalledWith('test-token');

    await pushNotificationService.deregisterDevicePushToken();
    expect(deregisterSpy).toHaveBeenCalled();
  });

  it('renders notification inbox with read/unread state and badge count', async () => {
    jest.spyOn(notificationService, 'getNotifications').mockResolvedValueOnce({
      notifications: mockNotifications,
      unreadCount: 1,
    });

    const { findByText } = render(
      <ThemeProvider>
        <NotificationsScreen />
      </ThemeProvider>
    );

    expect(await findByText('Notifications')).toBeTruthy();
    expect(await findByText('1 unread')).toBeTruthy();
    expect(await findByText('New Team Invitation')).toBeTruthy();
    expect(await findByText('Meeting Scheduled')).toBeTruthy();
  });

  it('filters notifications when Unread filter chip is pressed', async () => {
    jest.spyOn(notificationService, 'getNotifications').mockResolvedValueOnce({
      notifications: mockNotifications,
      unreadCount: 1,
    });

    const { findByText, getByText, queryByText } = render(
      <ThemeProvider>
        <NotificationsScreen />
      </ThemeProvider>
    );

    await findByText('New Team Invitation');
    const unreadChip = getByText('Unread (1)');
    fireEvent.press(unreadChip);

    expect(await findByText('New Team Invitation')).toBeTruthy();
    expect(queryByText('Meeting Scheduled')).toBeNull();
  });

  it('marks a notification as read and triggers deep link navigation on tap', async () => {
    jest.spyOn(notificationService, 'getNotifications').mockResolvedValueOnce({
      notifications: mockNotifications,
      unreadCount: 1,
    });
    const markAsReadSpy = jest
      .spyOn(notificationService, 'markAsRead')
      .mockResolvedValueOnce({ ...mockNotifications[0], isRead: true });

    const { findByText, getByTestId } = render(
      <ThemeProvider>
        <NotificationsScreen />
      </ThemeProvider>
    );

    await findByText('New Team Invitation');
    const notifItem = getByTestId('notification-item-notif-1');
    fireEvent.press(notifItem);

    expect(Haptics.impactAsync).toHaveBeenCalled();
    expect(markAsReadSpy).toHaveBeenCalledWith('notif-1');
    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Matching');
    });
  });

  it('marks all notifications as read when Mark all read is pressed', async () => {
    jest.spyOn(notificationService, 'getNotifications').mockResolvedValueOnce({
      notifications: mockNotifications,
      unreadCount: 1,
    });
    const markAllSpy = jest
      .spyOn(notificationService, 'markAllAsRead')
      .mockResolvedValueOnce({ success: true });

    const { findByText, getByText, queryByText } = render(
      <ThemeProvider>
        <NotificationsScreen />
      </ThemeProvider>
    );

    await findByText('Notifications');
    const markAllBtn = getByText('Mark all read');
    fireEvent.press(markAllBtn);

    expect(markAllSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(queryByText('Mark all read')).toBeNull();
    });
  });

  it('renders empty state when no notifications exist', async () => {
    jest.spyOn(notificationService, 'getNotifications').mockResolvedValueOnce({
      notifications: [],
      unreadCount: 0,
    });

    const { findByText } = render(
      <ThemeProvider>
        <NotificationsScreen />
      </ThemeProvider>
    );

    expect(await findByText('No notifications yet')).toBeTruthy();
  });

  it('renders error state when notification request fails', async () => {
    jest
      .spyOn(notificationService, 'getNotifications')
      .mockRejectedValueOnce(new Error('Network error'));

    const { findByText } = render(
      <ThemeProvider>
        <NotificationsScreen />
      </ThemeProvider>
    );

    expect(await findByText('Network error')).toBeTruthy();
  });
});
