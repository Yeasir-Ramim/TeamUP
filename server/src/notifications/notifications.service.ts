import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a mobile device push token (idempotent upsert)
   */
  async registerPushToken(userId: string, dto: RegisterPushTokenDto) {
    const rawToken = dto.token || dto.pushToken;
    if (!rawToken) {
      return { registered: false, message: 'Push token is missing' };
    }

    await this.prisma.pushToken.upsert({
      where: { token: rawToken },
      create: {
        userId,
        token: rawToken,
        device: dto.device,
      },
      update: {
        userId,
        device: dto.device,
      },
    });

    return {
      registered: true,
      message: 'Push token registered successfully',
    };
  }

  /**
   * Unregister a device push token (e.g. on logout)
   */
  async unregisterPushToken(userId: string, token: string) {
    await this.prisma.pushToken.deleteMany({
      where: {
        userId,
        token,
      },
    });

    return {
      unregistered: true,
      message: 'Push token unregistered successfully',
    };
  }

  /**
   * Get paginated notifications for the authenticated user
   */
  async getUserNotifications(userId: string, query: NotificationQueryDto) {
    const { page = 1, limit = 20, unreadOnly } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [total, notifications] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get total unread notifications count (for app tab bar badge)
   */
  async getUnreadCount(userId: string) {
    const unreadCount = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { unreadCount };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notification with ID '${notificationId}' not found`,
      );
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all unread notifications as read
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return {
      updatedCount: result.count,
    };
  }

  /**
   * Delete / dismiss a notification
   */
  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notification with ID '${notificationId}' not found`,
      );
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return {
      message: 'Notification deleted successfully',
    };
  }

  /**
   * Send notification: persists in DB, then asynchronously dispatches push alert
   */
  async notifyUser(userId: string, dto: SendNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title: dto.title,
        body: dto.body,
        type: dto.type,
        data: dto.data ?? {},
      },
    });

    // Asynchronously dispatch push alert without blocking database transaction
    void this.dispatchPushNotification(userId, dto);

    return notification;
  }

  /**
   * Asynchronous Expo push dispatcher with error pruning and timeout protection
   */
  async dispatchPushNotification(userId: string, payload: SendNotificationDto) {
    try {
      const pushTokens = await this.prisma.pushToken.findMany({
        where: { userId },
        select: { token: true },
      });

      if (pushTokens.length === 0) {
        return;
      }

      const messages = pushTokens.map((pt) => ({
        to: pt.token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: {
          ...(payload.data || {}),
          type: payload.type,
        },
      }));

      const endpoint =
        this.configService.get<string>('EXPO_PUSH_TOKEN_ENDPOINT') ||
        'https://exp.host/--/api/v2/push/send';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const json = (await response.json()) as {
          data?: Array<{ status: string; details?: { error?: string } }>;
        };

        if (json.data && Array.isArray(json.data)) {
          for (let i = 0; i < json.data.length; i++) {
            const ticket = json.data[i];
            if (
              ticket.status === 'error' &&
              ticket.details?.error === 'DeviceNotRegistered'
            ) {
              const staleToken = pushTokens[i]?.token;
              if (staleToken) {
                await this.prisma.pushToken.deleteMany({
                  where: { token: staleToken },
                });
              }
            }
          }
        }
      }
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to dispatch push notification for user ${userId}: ${(err as Error).message}`,
      );
    }
  }
}
