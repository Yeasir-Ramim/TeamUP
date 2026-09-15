import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { IdeasService } from './ideas.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('IdeasService', () => {
  let service: IdeasService;

  const mockPrismaService = {
    idea: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockNotificationsService = {
    notifyUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdeasService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<IdeasService>(IdeasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createIdea', () => {
    it('should create an idea with normalized tags and author relation', async () => {
      const dto = {
        title: 'Autonomous Quadcopter',
        description: 'Building an autonomous delivery drone using ROS 2',
        domain: 'Robotics',
        suggestedStack: ['  ROS 2 ', 'Python', 'ROS 2', ''],
      };

      const createdIdea = {
        id: 'idea-1',
        title: 'Autonomous Quadcopter',
        description: 'Building an autonomous delivery drone using ROS 2',
        domain: 'Robotics',
        suggestedStack: ['ROS 2', 'Python'],
        authorId: 'user-1',
        author: {
          id: 'user-1',
          email: 'user1@example.com',
          role: 'STUDENT',
          profile: { fullName: 'Alex Rivera' },
        },
      };

      mockPrismaService.idea.create.mockResolvedValue(createdIdea);

      const result = await service.createIdea('user-1', dto);

      expect(result).toEqual(createdIdea);
      expect(mockPrismaService.idea.create).toHaveBeenCalledWith({
        data: {
          title: 'Autonomous Quadcopter',
          description: 'Building an autonomous delivery drone using ROS 2',
          domain: 'Robotics',
          suggestedStack: ['ROS 2', 'Python'],
          authorId: 'user-1',
        },
        include: expect.any(Object),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated ideas with applied filters', async () => {
      const query = {
        search: 'drone',
        domain: 'Robotics',
        tag: 'Python',
        authorId: 'user-1',
        page: 1,
        limit: 10,
      };

      const ideasList = [
        {
          id: 'idea-1',
          title: 'Autonomous Drone',
          domain: 'Robotics',
          suggestedStack: ['Python'],
        },
      ];

      mockPrismaService.idea.count.mockResolvedValue(1);
      mockPrismaService.idea.findMany.mockResolvedValue(ideasList);

      const result = await service.findAll(query);

      expect(result).toEqual({
        ideas: ideasList,
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });

      expect(mockPrismaService.idea.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'drone', mode: 'insensitive' } },
            { description: { contains: 'drone', mode: 'insensitive' } },
          ],
          domain: { equals: 'Robotics', mode: 'insensitive' },
          suggestedStack: { hasSome: ['Python'] },
          authorId: 'user-1',
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });
  });

  describe('getIdeaById', () => {
    it('should return idea if found', async () => {
      const mockIdea = { id: 'idea-1', title: 'Smart Agriculture' };
      mockPrismaService.idea.findUnique.mockResolvedValue(mockIdea);

      const result = await service.getIdeaById('idea-1');
      expect(result).toEqual(mockIdea);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.idea.findUnique.mockResolvedValue(null);

      await expect(service.getIdeaById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateIdea', () => {
    it('should update idea if user is author', async () => {
      mockPrismaService.idea.findUnique.mockResolvedValue({
        id: 'idea-1',
        authorId: 'user-1',
      });

      const updatedIdea = {
        id: 'idea-1',
        title: 'Updated Title',
        authorId: 'user-1',
      };
      mockPrismaService.idea.update.mockResolvedValue(updatedIdea);

      const result = await service.updateIdea('user-1', 'idea-1', {
        title: 'Updated Title',
      });

      expect(result).toEqual(updatedIdea);
      expect(mockPrismaService.idea.update).toHaveBeenCalledWith({
        where: { id: 'idea-1' },
        data: { title: 'Updated Title' },
        include: expect.any(Object),
      });
    });

    it('should throw ForbiddenException if user is not author', async () => {
      mockPrismaService.idea.findUnique.mockResolvedValue({
        id: 'idea-1',
        authorId: 'user-2',
      });

      await expect(
        service.updateIdea('user-1', 'idea-1', { title: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if idea does not exist', async () => {
      mockPrismaService.idea.findUnique.mockResolvedValue(null);

      await expect(
        service.updateIdea('user-1', 'ghost-id', { title: 'None' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteIdea', () => {
    it('should delete idea if user is author', async () => {
      mockPrismaService.idea.findUnique.mockResolvedValue({
        id: 'idea-1',
        authorId: 'user-1',
      });
      mockPrismaService.idea.delete.mockResolvedValue({ id: 'idea-1' });

      const result = await service.deleteIdea('user-1', 'idea-1');
      expect(result).toEqual({ message: 'Idea deleted successfully' });
      expect(mockPrismaService.idea.delete).toHaveBeenCalledWith({
        where: { id: 'idea-1' },
      });
    });

    it('should allow admin to delete idea even if not author', async () => {
      mockPrismaService.idea.findUnique.mockResolvedValue({
        id: 'idea-1',
        authorId: 'user-2',
      });
      mockPrismaService.idea.delete.mockResolvedValue({ id: 'idea-1' });

      const result = await service.deleteIdea('admin-user', 'idea-1', 'ADMIN');
      expect(result).toEqual({ message: 'Idea deleted successfully' });
    });

    it('should throw ForbiddenException if user is neither author nor admin', async () => {
      mockPrismaService.idea.findUnique.mockResolvedValue({
        id: 'idea-1',
        authorId: 'user-2',
      });

      await expect(
        service.deleteIdea('user-1', 'idea-1', 'STUDENT'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if idea not found', async () => {
      mockPrismaService.idea.findUnique.mockResolvedValue(null);

      await expect(service.deleteIdea('user-1', 'idea-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('expressInterest', () => {
    it('should dispatch notification to author and return success', async () => {
      mockPrismaService.idea.findUnique.mockResolvedValue({
        id: 'idea-1',
        title: 'Autonomous Drone',
        authorId: 'author-1',
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'collaborator@example.com',
        profile: { fullName: 'Sam Collab' },
      });

      mockNotificationsService.notifyUser.mockResolvedValue({ id: 'notif-1' });

      const result = await service.expressInterest('user-2', 'idea-1', {
        message: 'I have 2 years of ROS experience!',
      });

      expect(result).toEqual({ message: 'Interest expressed successfully' });
      expect(mockNotificationsService.notifyUser).toHaveBeenCalledWith(
        'author-1',
        expect.objectContaining({
          type: 'IDEA_INTEREST',
          data: expect.objectContaining({
            ideaId: 'idea-1',
            applicantId: 'user-2',
            applicantName: 'Sam Collab',
            message: 'I have 2 years of ROS experience!',
          }),
        }),
      );
    });

    it('should throw BadRequestException if author expresses interest in their own idea', async () => {
      mockPrismaService.idea.findUnique.mockResolvedValue({
        id: 'idea-1',
        title: 'My Own Idea',
        authorId: 'user-1',
      });

      await expect(
        service.expressInterest('user-1', 'idea-1', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if idea does not exist', async () => {
      mockPrismaService.idea.findUnique.mockResolvedValue(null);

      await expect(
        service.expressInterest('user-1', 'ghost-idea', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if authorId is null (author deleted)', async () => {
      mockPrismaService.idea.findUnique.mockResolvedValue({
        id: 'idea-1',
        title: 'Orphaned Idea',
        authorId: null,
      });

      await expect(
        service.expressInterest('user-2', 'idea-1', {}),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
