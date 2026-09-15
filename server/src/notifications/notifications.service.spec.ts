import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockPrismaService = {
    pushToken: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'EXPO_PUSH_TOKEN_ENDPOINT') {
        return 'https://exp.host/--/api/v2/push/send';
      }
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerPushToken', () => {
    it('should upsert push token idempotently', async () => {
      mockPrismaService.pushToken.upsert.mockResolvedValue({
        id: 'pt-1',
        userId: 'u-1',
        token: 'ExponentPushToken[abc123xxx]',
      });

      const result = await service.registerPushToken('u-1', {
        token: 'ExponentPushToken[abc123xxx]',
        device: 'iPhone 15',
      });

      expect(result).toEqual({
        registered: true,
        message: 'Push token registered successfully',
      });
      expect(mockPrismaService.pushToken.upsert).toHaveBeenCalledWith({
        where: { token: 'ExponentPushToken[abc123xxx]' },
        create: {
          userId: 'u-1',
          token: 'ExponentPushToken[abc123xxx]',
          device: 'iPhone 15',
        },
        update: {
          userId: 'u-1',
          device: 'iPhone 15',
        },
      });
    });
  });

  describe('unregisterPushToken', () => {
    it('should delete token for the user', async () => {
      mockPrismaService.pushToken.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.unregisterPushToken(
        'u-1',
        'ExponentPushToken[abc123xxx]',
      );

      expect(result).toEqual({
        unregistered: true,
        message: 'Push token unregistered successfully',
      });
      expect(mockPrismaService.pushToken.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'u-1',
          token: 'ExponentPushToken[abc123xxx]',
        },
      });
    });
  });

  describe('getUserNotifications', () => {
    it('should return paginated notifications with meta', async () => {
      const mockList = [
        {
          id: 'notif-1',
          userId: 'u-1',
          title: 'Invite Received',
          isRead: false,
        },
      ];
      mockPrismaService.notification.count.mockResolvedValue(1);
      mockPrismaService.notification.findMany.mockResolvedValue(mockList);

      const result = await service.getUserNotifications('u-1', {
        page: 1,
        limit: 10,
        unreadOnly: true,
      });

      expect(result).toEqual({
        notifications: mockList,
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'u-1',
          isRead: false,
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      mockPrismaService.notification.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('u-1');

      expect(result).toEqual({ unreadCount: 3 });
      expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
        where: {
          userId: 'u-1',
          isRead: false,
        },
      });
    });
  });

  describe('markAsRead', () => {
    it('should update notification isRead to true', async () => {
      mockPrismaService.notification.findFirst.mockResolvedValue({
        id: 'notif-1',
        userId: 'u-1',
        isRead: false,
      });
      mockPrismaService.notification.update.mockResolvedValue({
        id: 'notif-1',
        userId: 'u-1',
        isRead: true,
      });

      const result = await service.markAsRead('u-1', 'notif-1');

      expect(result.isRead).toBe(true);
      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true },
      });
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      mockPrismaService.notification.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead('u-1', 'unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should update all unread notifications to true', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead('u-1');

      expect(result).toEqual({ updatedCount: 5 });
      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'u-1',
          isRead: false,
        },
        data: { isRead: true },
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification if found', async () => {
      mockPrismaService.notification.findFirst.mockResolvedValue({
        id: 'notif-1',
        userId: 'u-1',
      });
      mockPrismaService.notification.delete.mockResolvedValue({
        id: 'notif-1',
      });

      const result = await service.deleteNotification('u-1', 'notif-1');

      expect(result).toEqual({
        message: 'Notification deleted successfully',
      });
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.notification.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteNotification('u-1', 'unknown'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('notifyUser & dispatchPushNotification', () => {
    it('should persist notification in database and trigger push dispatch', async () => {
      const mockSaved = {
        id: 'notif-1',
        userId: 'u-1',
        title: 'Project Invitation',
        body: 'You were invited to AI Study',
        type: 'INVITATION',
        data: { projectId: 'p-1' },
      };
      mockPrismaService.notification.create.mockResolvedValue(mockSaved);
      mockPrismaService.pushToken.findMany.mockResolvedValue([]);

      const result = await service.notifyUser('u-1', {
        title: 'Project Invitation',
        body: 'You were invited to AI Study',
        type: 'INVITATION',
        data: { projectId: 'p-1' },
      });

      expect(result).toEqual(mockSaved);
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'u-1',
          title: 'Project Invitation',
          body: 'You were invited to AI Study',
          type: 'INVITATION',
          data: { projectId: 'p-1' },
        },
      });
    });

    it('should gracefully handle push dispatch errors without throwing', async () => {
      mockPrismaService.pushToken.findMany.mockRejectedValue(
        new Error('DB connection drop'),
      );

      // Should not throw
      await expect(
        service.dispatchPushNotification('u-1', {
          title: 'Test',
          body: 'Test body',
          type: 'TEST',
        }),
      ).resolves.not.toThrow();
    });
  });
});
