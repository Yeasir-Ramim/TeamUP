import { Test, TestingModule } from '@nestjs/testing';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';
import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

describe('IdeasController', () => {
  let controller: IdeasController;

  const mockIdeasService = {
    createIdea: jest.fn(),
    findAll: jest.fn(),
    getIdeaById: jest.fn(),
    updateIdea: jest.fn(),
    deleteIdea: jest.fn(),
    expressInterest: jest.fn(),
  };

  const mockUser: AuthenticatedUser = {
    userId: 'user-1',
    email: 'test@example.com',
    role: UserRole.STUDENT,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IdeasController],
      providers: [{ provide: IdeasService, useValue: mockIdeasService }],
    }).compile();

    controller = module.get<IdeasController>(IdeasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createIdea', () => {
    it('should delegate to ideasService.createIdea', async () => {
      const dto = {
        title: 'New Idea',
        description: 'Detailed description with more than 10 characters',
        domain: 'AI',
        suggestedStack: ['NestJS', 'PyTorch'],
      };
      const expectedResult = {
        id: 'idea-1',
        ...dto,
        authorId: mockUser.userId,
      };
      mockIdeasService.createIdea.mockResolvedValue(expectedResult);

      const result = await controller.createIdea(mockUser, dto);
      expect(result).toEqual(expectedResult);
      expect(mockIdeasService.createIdea).toHaveBeenCalledWith(
        mockUser.userId,
        dto,
      );
    });
  });

  describe('findAll', () => {
    it('should delegate to ideasService.findAll', async () => {
      const query = { domain: 'AI', page: 1, limit: 10 };
      const expectedResult = {
        ideas: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
      mockIdeasService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);
      expect(result).toEqual(expectedResult);
      expect(mockIdeasService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('getIdeaById', () => {
    it('should delegate to ideasService.getIdeaById', async () => {
      const expectedResult = { id: 'idea-1', title: 'Idea 1' };
      mockIdeasService.getIdeaById.mockResolvedValue(expectedResult);

      const result = await controller.getIdeaById('idea-1');
      expect(result).toEqual(expectedResult);
      expect(mockIdeasService.getIdeaById).toHaveBeenCalledWith('idea-1');
    });
  });

  describe('updateIdea', () => {
    it('should delegate to ideasService.updateIdea', async () => {
      const dto = { title: 'Updated Idea' };
      const expectedResult = { id: 'idea-1', title: 'Updated Idea' };
      mockIdeasService.updateIdea.mockResolvedValue(expectedResult);

      const result = await controller.updateIdea(mockUser, 'idea-1', dto);
      expect(result).toEqual(expectedResult);
      expect(mockIdeasService.updateIdea).toHaveBeenCalledWith(
        mockUser.userId,
        'idea-1',
        dto,
      );
    });
  });

  describe('deleteIdea', () => {
    it('should delegate to ideasService.deleteIdea', async () => {
      const expectedResult = { message: 'Idea deleted successfully' };
      mockIdeasService.deleteIdea.mockResolvedValue(expectedResult);

      const result = await controller.deleteIdea(mockUser, 'idea-1');
      expect(result).toEqual(expectedResult);
      expect(mockIdeasService.deleteIdea).toHaveBeenCalledWith(
        mockUser.userId,
        'idea-1',
        mockUser.role,
      );
    });
  });

  describe('expressInterest', () => {
    it('should delegate to ideasService.expressInterest', async () => {
      const dto = { message: 'Let us build this together!' };
      const expectedResult = { message: 'Interest expressed successfully' };
      mockIdeasService.expressInterest.mockResolvedValue(expectedResult);

      const result = await controller.expressInterest(mockUser, 'idea-1', dto);
      expect(result).toEqual(expectedResult);
      expect(mockIdeasService.expressInterest).toHaveBeenCalledWith(
        mockUser.userId,
        'idea-1',
        dto,
      );
    });
  });
});
