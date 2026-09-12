import { Test, TestingModule } from '@nestjs/testing';
import { BookmarksService } from './bookmarks.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { BookmarkType, ProjectStatus } from '@prisma/client';

describe('BookmarksService', () => {
  let service: BookmarksService;

  const mockPrismaService = {
    bookmark: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    idea: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BookmarksService>(BookmarksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateTargetExists', () => {
    it('should return project when targetType is PROJECT and exists', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({ id: 'p-1' });
      const result = await service.validateTargetExists(
        BookmarkType.PROJECT,
        'p-1',
      );
      expect(result).toEqual({ id: 'p-1' });
      expect(mockPrismaService.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'p-1' },
      });
    });

    it('should throw NotFoundException when project does not exist', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);
      await expect(
        service.validateTargetExists(BookmarkType.PROJECT, 'unknown'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return idea when targetType is IDEA and exists', async () => {
      mockPrismaService.idea.findUnique.mockResolvedValue({ id: 'i-1' });
      const result = await service.validateTargetExists(
        BookmarkType.IDEA,
        'i-1',
      );
      expect(result).toEqual({ id: 'i-1' });
    });

    it('should throw NotFoundException when idea does not exist', async () => {
      mockPrismaService.idea.findUnique.mockResolvedValue(null);
      await expect(
        service.validateTargetExists(BookmarkType.IDEA, 'unknown'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addBookmark', () => {
    it('should validate target and upsert bookmark record idempotently', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({ id: 'p-1' });
      mockPrismaService.bookmark.upsert.mockResolvedValue({
        id: 'b-1',
        userId: 'u-1',
        targetType: BookmarkType.PROJECT,
        targetId: 'p-1',
      });

      const result = await service.addBookmark(
        'u-1',
        BookmarkType.PROJECT,
        'p-1',
      );

      expect(result).toEqual({
        bookmarked: true,
        message: 'Bookmark added successfully',
      });
      expect(mockPrismaService.bookmark.upsert).toHaveBeenCalledWith({
        where: {
          userId_targetType_targetId: {
            userId: 'u-1',
            targetType: BookmarkType.PROJECT,
            targetId: 'p-1',
          },
        },
        create: {
          userId: 'u-1',
          targetType: BookmarkType.PROJECT,
          targetId: 'p-1',
        },
        update: {},
      });
    });
  });

  describe('removeBookmark', () => {
    it('should delete bookmark and return bookmarked: false', async () => {
      mockPrismaService.bookmark.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.removeBookmark(
        'u-1',
        BookmarkType.PROJECT,
        'p-1',
      );

      expect(result).toEqual({
        bookmarked: false,
        message: 'Bookmark removed successfully',
      });
      expect(mockPrismaService.bookmark.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'u-1',
          targetType: BookmarkType.PROJECT,
          targetId: 'p-1',
        },
      });
    });
  });

  describe('toggleBookmark', () => {
    it('should remove bookmark if it already exists', async () => {
      mockPrismaService.bookmark.findUnique.mockResolvedValue({ id: 'b-1' });
      mockPrismaService.bookmark.delete.mockResolvedValue({ id: 'b-1' });

      const result = await service.toggleBookmark(
        'u-1',
        BookmarkType.PROJECT,
        'p-1',
      );

      expect(result).toEqual({
        bookmarked: false,
        message: 'Bookmark removed successfully',
      });
      expect(mockPrismaService.bookmark.delete).toHaveBeenCalledWith({
        where: { id: 'b-1' },
      });
    });

    it('should add bookmark if it does not exist', async () => {
      mockPrismaService.bookmark.findUnique.mockResolvedValue(null);
      mockPrismaService.project.findUnique.mockResolvedValue({ id: 'p-1' });
      mockPrismaService.bookmark.create.mockResolvedValue({ id: 'b-1' });

      const result = await service.toggleBookmark(
        'u-1',
        BookmarkType.PROJECT,
        'p-1',
      );

      expect(result).toEqual({
        bookmarked: true,
        message: 'Bookmark added successfully',
      });
      expect(mockPrismaService.bookmark.create).toHaveBeenCalledWith({
        data: {
          userId: 'u-1',
          targetType: BookmarkType.PROJECT,
          targetId: 'p-1',
        },
      });
    });
  });

  describe('getUserBookmarkedIds', () => {
    it('should return array of string IDs', async () => {
      mockPrismaService.bookmark.findMany.mockResolvedValue([
        { targetId: 'p-1' },
        { targetId: 'p-2' },
      ]);

      const result = await service.getUserBookmarkedIds(
        'u-1',
        BookmarkType.PROJECT,
      );

      expect(result).toEqual(['p-1', 'p-2']);
      expect(mockPrismaService.bookmark.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'u-1',
          targetType: BookmarkType.PROJECT,
        },
        select: { targetId: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getBookmarkedProjects', () => {
    it('should return normalized ProjectListing[] with isBookmarked = true', async () => {
      mockPrismaService.bookmark.findMany.mockResolvedValue([
        { targetId: 'p-1', createdAt: new Date() },
      ]);
      mockPrismaService.project.findMany.mockResolvedValue([
        {
          id: 'p-1',
          title: 'AI Study Group',
          description: 'Study buddy app',
          domain: 'Education',
          semester: 'Fall 2026',
          status: ProjectStatus.OPEN,
          maxMembers: 4,
          createdAt: new Date('2026-09-01'),
          creator: {
            id: 'u-2',
            email: 'creator@uni.edu',
            profile: { fullName: 'Creator Name', avatarUrl: null },
          },
          requiredSkills: [{ skill: { name: 'React' } }],
          members: [{ id: 'm-1' }],
          _count: { members: 1 },
        },
      ]);

      const result = await service.getBookmarkedProjects('u-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'p-1',
        title: 'AI Study Group',
        description: 'Study buddy app',
        domain: 'Education',
        semester: 'Fall 2026',
        status: ProjectStatus.OPEN,
        requiredSkills: ['React'],
        ownerName: 'Creator Name',
        memberCount: 1,
        maxMembers: 4,
        createdAt: new Date('2026-09-01'),
        isBookmarked: true,
      });
    });

    it('should return empty array if user has no bookmarks', async () => {
      mockPrismaService.bookmark.findMany.mockResolvedValue([]);
      const result = await service.getBookmarkedProjects('u-1');
      expect(result).toEqual([]);
      expect(mockPrismaService.project.findMany).not.toHaveBeenCalled();
    });
  });
});
