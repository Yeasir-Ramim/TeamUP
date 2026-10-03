import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ForbiddenException } from '@nestjs/common';
import { MemberStatus } from '@prisma/client';

describe('ChatService', () => {
  let service: ChatService;

  const mockPrismaService = {
    projectMember: {
      findFirst: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    directMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockNotificationsService = {
    notifyUser: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyProjectMembership', () => {
    it('should pass if user is an accepted project member', async () => {
      mockPrismaService.projectMember.findFirst.mockResolvedValue({
        id: 'pm-1',
        projectId: 'proj-1',
        userId: 'user-1',
        status: MemberStatus.ACCEPTED,
      });

      await expect(
        service.verifyProjectMembership('proj-1', 'user-1'),
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrismaService.projectMember.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyProjectMembership('proj-1', 'user-2'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('sendDirectMessage', () => {
    it('should create DM and notify recipient', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-recipient',
        email: 'recipient@uni.edu',
      });

      const mockCreatedDm = {
        id: 'dm-1',
        senderId: 'user-sender',
        recipientId: 'user-recipient',
        content: 'Hey, let us team up!',
        projectId: 'proj-1',
        createdAt: new Date(),
        sender: {
          id: 'user-sender',
          email: 'sender@uni.edu',
          profile: { fullName: 'Alice Wonder', avatarUrl: null },
        },
        recipient: {
          id: 'user-recipient',
          email: 'recipient@uni.edu',
          profile: { fullName: 'Bob Builder', avatarUrl: null },
        },
      };

      mockPrismaService.directMessage.create.mockResolvedValue(mockCreatedDm);

      const result = await service.sendDirectMessage(
        'user-sender',
        'user-recipient',
        'Hey, let us team up!',
        'proj-1',
      );

      expect(result).toEqual(mockCreatedDm);
      expect(mockNotificationsService.notifyUser).toHaveBeenCalledWith(
        'user-recipient',
        expect.objectContaining({
          type: 'DIRECT_MESSAGE',
          title: 'New message from Alice Wonder',
          body: 'Hey, let us team up!',
          data: expect.objectContaining({
            senderId: 'user-sender',
            projectId: 'proj-1',
            screen: 'Chat',
            type: 'dm',
            targetUserId: 'user-sender',
          }),
        }),
      );
    });

    it('should throw ForbiddenException if recipient does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.sendDirectMessage('user-1', 'invalid-user', 'Hello'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getDirectMessages', () => {
    it('should fetch DM messages between two users', async () => {
      mockPrismaService.directMessage.findMany.mockResolvedValue([
        { id: 'dm-1', content: 'Hi' },
      ]);

      const messages = await service.getDirectMessages('u1', 'u2', 20);

      expect(messages).toEqual([{ id: 'dm-1', content: 'Hi' }]);
      expect(mockPrismaService.directMessage.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { senderId: 'u1', recipientId: 'u2' },
            { senderId: 'u2', recipientId: 'u1' },
          ],
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });
  });
});
