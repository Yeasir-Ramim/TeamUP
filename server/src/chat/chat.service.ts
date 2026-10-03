import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemberStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Verify user is a member of the project
   */
  async verifyProjectMembership(
    projectId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
        status: MemberStatus.ACCEPTED,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You must be a project member to access chat',
      );
    }
  }

  /**
   * Send a message and persist to database
   */
  async sendMessage(projectId: string, senderId: string, content: string) {
    // Verify membership
    await this.verifyProjectMembership(projectId, senderId);

    // Persist message
    const message = await this.prisma.message.create({
      data: {
        projectId,
        senderId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return message;
  }

  /**
   * Get recent message history for a project
   */
  async getRecentMessages(projectId: string, limit: number = 50) {
    const messages = await this.prisma.message.findMany({
      where: { projectId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Return in chronological order (oldest first)
    return messages.reverse();
  }

  /**
   * Get all messages for a project (REST endpoint alternative)
   */
  async getProjectMessages(projectId: string, userId: string) {
    await this.verifyProjectMembership(projectId, userId);

    const messages = await this.prisma.message.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return messages;
  }

  /**
   * Send a direct message (1-on-1) and persist to database
   */
  async sendDirectMessage(
    senderId: string,
    recipientId: string,
    content: string,
    projectId?: string,
  ) {
    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      throw new ForbiddenException('Recipient user not found');
    }

    const dm = await this.prisma.directMessage.create({
      data: {
        senderId,
        recipientId,
        content,
        projectId: projectId || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const senderName =
      dm.sender?.profile?.fullName || dm.sender?.email || 'Someone';

    await this.notificationsService.notifyUser(recipientId, {
      title: `New message from ${senderName}`,
      body: content.length > 100 ? `${content.substring(0, 97)}...` : content,
      type: 'DIRECT_MESSAGE',
      data: {
        senderId,
        projectId: projectId || undefined,
        screen: 'Chat',
        type: 'dm',
        targetUserId: senderId,
      },
    });

    return dm;
  }

  /**
   * Get direct message history between two users
   */
  async getDirectMessages(
    userAId: string,
    userBId: string,
    limit: number = 50,
  ) {
    const messages = await this.prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userAId, recipientId: userBId },
          { senderId: userBId, recipientId: userAId },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return messages.reverse();
  }

  /**
   * Get all active DM conversations for a user with the latest message
   */
  async getUserConversations(userId: string) {
    const messages = await this.prisma.directMessage.findMany({
      where: {
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const conversationMap = new Map<string, any>();
    for (const msg of messages) {
      const otherUser = msg.senderId === userId ? msg.recipient : msg.sender;
      if (!otherUser || !otherUser.id) continue;
      if (!conversationMap.has(otherUser.id)) {
        conversationMap.set(otherUser.id, {
          user: otherUser,
          lastMessage: {
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt,
            senderId: msg.senderId,
          },
        });
      }
    }

    return Array.from(conversationMap.values());
  }
}
