import { Test, TestingModule } from '@nestjs/testing';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';
import { BookmarkType } from '@prisma/client';

describe('BookmarksController', () => {
  let controller: BookmarksController;

  const mockBookmarksService = {
    getUserBookmarks: jest.fn(),
    getUserBookmarkedIds: jest.fn(),
    addBookmark: jest.fn(),
    toggleBookmark: jest.fn(),
    removeBookmark: jest.fn(),
  };

  const mockUser = {
    userId: 'u-1',
    email: 'user@uni.edu',
    role: 'STUDENT' as const,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookmarksController],
      providers: [
        { provide: BookmarksService, useValue: mockBookmarksService },
      ],
    }).compile();

    controller = module.get<BookmarksController>(BookmarksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getMyBookmarks with filter', async () => {
    mockBookmarksService.getUserBookmarks.mockResolvedValue([{ id: 'b-1' }]);

    const result = await controller.getMyBookmarks(mockUser, {
      type: BookmarkType.PROJECT,
    });

    expect(result).toEqual([{ id: 'b-1' }]);
    expect(mockBookmarksService.getUserBookmarks).toHaveBeenCalledWith(
      'u-1',
      BookmarkType.PROJECT,
    );
  });

  it('should call getMyBookmarkedIds', async () => {
    mockBookmarksService.getUserBookmarkedIds.mockResolvedValue(['p-1', 'p-2']);

    const result = await controller.getMyBookmarkedIds(mockUser, {});

    expect(result).toEqual(['p-1', 'p-2']);
    expect(mockBookmarksService.getUserBookmarkedIds).toHaveBeenCalledWith(
      'u-1',
      undefined,
    );
  });

  it('should call addBookmark', async () => {
    mockBookmarksService.addBookmark.mockResolvedValue({
      bookmarked: true,
      message: 'Bookmark added successfully',
    });

    const result = await controller.addBookmark(mockUser, {
      targetType: BookmarkType.PROJECT,
      targetId: 'p-1',
    });

    expect(result.bookmarked).toBe(true);
    expect(mockBookmarksService.addBookmark).toHaveBeenCalledWith(
      'u-1',
      BookmarkType.PROJECT,
      'p-1',
    );
  });

  it('should call toggleBookmark', async () => {
    mockBookmarksService.toggleBookmark.mockResolvedValue({
      bookmarked: false,
      message: 'Bookmark removed successfully',
    });

    const result = await controller.toggleBookmark(mockUser, {
      targetType: BookmarkType.PROJECT,
      targetId: 'p-1',
    });

    expect(result.bookmarked).toBe(false);
    expect(mockBookmarksService.toggleBookmark).toHaveBeenCalledWith(
      'u-1',
      BookmarkType.PROJECT,
      'p-1',
    );
  });

  it('should call removeBookmark', async () => {
    mockBookmarksService.removeBookmark.mockResolvedValue({
      bookmarked: false,
      message: 'Bookmark removed successfully',
    });

    const result = await controller.removeBookmark(
      mockUser,
      BookmarkType.PROJECT,
      'p-1',
    );

    expect(result.bookmarked).toBe(false);
    expect(mockBookmarksService.removeBookmark).toHaveBeenCalledWith(
      'u-1',
      BookmarkType.PROJECT,
      'p-1',
    );
  });
});
