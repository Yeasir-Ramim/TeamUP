import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { MatchingService } from '../matching/matching.service';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { BookmarkType, ProjectStatus, UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

describe('ProjectsController', () => {
  let controller: ProjectsController;

  const mockProjectsService = {
    createProject: jest.fn(),
    search: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateProject: jest.fn(),
    deleteProject: jest.fn(),
    applyToProject: jest.fn(),
  };

  const mockMatchingService = {
    getRecommendations: jest.fn(),
  };

  const mockBookmarksService = {
    getBookmarkedProjects: jest.fn(),
    addBookmark: jest.fn(),
    removeBookmark: jest.fn(),
  };

  const mockUser: AuthenticatedUser = {
    userId: 'user-leader-1',
    email: 'leader@uni.edu',
    role: UserRole.STUDENT,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        { provide: ProjectsService, useValue: mockProjectsService },
        { provide: MatchingService, useValue: mockMatchingService },
        { provide: BookmarksService, useValue: mockBookmarksService },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchProjects (GET /projects/search)', () => {
    it('should delegate search to projectsService.search', async () => {
      const query = { domain: 'Fintech', tech: 'React Native' };
      const expectedResults = [
        {
          id: 'proj-1',
          title: 'Fintech Project',
          domain: 'Fintech',
        },
      ];
      mockProjectsService.search.mockResolvedValue(expectedResults);

      const result = await controller.searchProjects(query);

      expect(result).toEqual(expectedResults);
      expect(mockProjectsService.search).toHaveBeenCalledWith(query);
    });
  });

  describe('createProject (POST /projects)', () => {
    it('should delegate creation to projectsService.createProject', async () => {
      const dto = {
        title: 'New Study Group',
        description: 'Collaborative platform',
        domain: 'Education',
        semester: 'Fall 2026',
        maxMembers: 4,
        requiredSkillIds: ['skill-1'],
      };
      const created = { id: 'proj-1', ...dto, creatorId: mockUser.userId };
      mockProjectsService.createProject.mockResolvedValue(created);

      const result = await controller.createProject(mockUser, dto);

      expect(result).toEqual(created);
      expect(mockProjectsService.createProject).toHaveBeenCalledWith(
        mockUser.userId,
        dto,
      );
    });
  });

  describe('getProjects (GET /projects)', () => {
    it('should delegate listing to projectsService.findAll', async () => {
      const query = { domain: 'Education' };
      const expected = [{ id: 'proj-1', title: 'Edu Platform' }];
      mockProjectsService.findAll.mockResolvedValue(expected);

      const result = await controller.getProjects(query);

      expect(result).toEqual(expected);
      expect(mockProjectsService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('getProjectById (GET /projects/:id)', () => {
    it('should delegate to projectsService.findById', async () => {
      const expected = { id: 'proj-1', title: 'Edu Platform' };
      mockProjectsService.findById.mockResolvedValue(expected);

      const result = await controller.getProjectById('proj-1');

      expect(result).toEqual(expected);
      expect(mockProjectsService.findById).toHaveBeenCalledWith('proj-1');
    });
  });

  describe('getRecommendations (GET /projects/:id/recommendations)', () => {
    it('should delegate to matchingService.getRecommendations', async () => {
      const expected = [
        {
          userId: 'user-rec-1',
          fullName: 'Recommended Alice',
          matchScore: 92,
        },
      ];
      mockMatchingService.getRecommendations.mockResolvedValue(expected);

      const result = await controller.getRecommendations('proj-1', mockUser);

      expect(result).toEqual(expected);
      expect(mockMatchingService.getRecommendations).toHaveBeenCalledWith(
        'proj-1',
        mockUser.userId,
      );
    });
  });

  describe('bookmarkProject (POST /projects/:id/bookmark)', () => {
    it('should delegate to bookmarksService.addBookmark with PROJECT type', async () => {
      const expected = { bookmarked: true };
      mockBookmarksService.addBookmark.mockResolvedValue(expected);

      const result = await controller.bookmarkProject('proj-1', mockUser);

      expect(result).toEqual(expected);
      expect(mockBookmarksService.addBookmark).toHaveBeenCalledWith(
        mockUser.userId,
        BookmarkType.PROJECT,
        'proj-1',
      );
    });
  });

  describe('removeProjectBookmark (DELETE /projects/:id/bookmark)', () => {
    it('should delegate to bookmarksService.removeBookmark', async () => {
      const expected = { bookmarked: false };
      mockBookmarksService.removeBookmark.mockResolvedValue(expected);

      const result = await controller.removeProjectBookmark('proj-1', mockUser);

      expect(result).toEqual(expected);
      expect(mockBookmarksService.removeBookmark).toHaveBeenCalledWith(
        mockUser.userId,
        BookmarkType.PROJECT,
        'proj-1',
      );
    });
  });

  describe('updateProject (PATCH /projects/:id)', () => {
    it('should delegate to projectsService.updateProject', async () => {
      const dto = { status: ProjectStatus.IN_PROGRESS };
      const updated = { id: 'proj-1', status: ProjectStatus.IN_PROGRESS };
      mockProjectsService.updateProject.mockResolvedValue(updated);

      const result = await controller.updateProject(mockUser, 'proj-1', dto);

      expect(result).toEqual(updated);
      expect(mockProjectsService.updateProject).toHaveBeenCalledWith(
        'proj-1',
        mockUser.userId,
        dto,
      );
    });
  });

  describe('deleteProject (DELETE /projects/:id)', () => {
    it('should delegate to projectsService.deleteProject', async () => {
      const expected = { message: 'Project deleted successfully' };
      mockProjectsService.deleteProject.mockResolvedValue(expected);

      const result = await controller.deleteProject(mockUser, 'proj-1');

      expect(result).toEqual(expected);
      expect(mockProjectsService.deleteProject).toHaveBeenCalledWith(
        'proj-1',
        mockUser.userId,
      );
    });
  });

  describe('applyToProject (POST /projects/:id/members)', () => {
    it('should delegate to projectsService.applyToProject', async () => {
      const expected = { status: 'PENDING', message: 'Application submitted' };
      mockProjectsService.applyToProject.mockResolvedValue(expected);

      const result = await controller.applyToProject(mockUser, 'proj-1');

      expect(result).toEqual(expected);
      expect(mockProjectsService.applyToProject).toHaveBeenCalledWith(
        'proj-1',
        mockUser.userId,
      );
    });
  });
});
