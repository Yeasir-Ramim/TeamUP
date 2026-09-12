import { Test, TestingModule } from '@nestjs/testing';
import { GithubService } from './github.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('GithubService', () => {
  let service: GithubService;

  const mockPrismaService = {
    profile: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string): string | undefined => {
      if (key === 'GITHUB_CLIENT_ID') return 'mock_client_id';
      if (key === 'GITHUB_CLIENT_SECRET') return 'mock_client_secret';
      return defaultValue;
    }),
  };

  // Mock global fetch
  const originalFetch = global.fetch;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<GithubService>(GithubService);
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAuthUrl', () => {
    it('should generate valid GitHub OAuth URL', () => {
      const result = service.getAuthUrl();
      expect(result.url).toContain('https://github.com/login/oauth/authorize');
      expect(result.url).toContain('client_id=mock_client_id');
      expect(result.url).toContain('scope=read:user%20repo');
    });

    it('should append redirect_uri when provided', () => {
      const result = service.getAuthUrl('teamup://callback');
      expect(result.url).toContain('redirect_uri=teamup%3A%2F%2Fcallback');
    });
  });

  describe('linkAccount', () => {
    it('should throw BadRequestException if token exchange fails', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            error: 'bad_verification_code',
            error_description: 'The code is invalid',
          }),
      });

      await expect(service.linkAccount('user-1', 'bad-code')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if user fetch fails', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'valid_access_token' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Bad credentials' }),
        });

      await expect(service.linkAccount('user-1', 'valid-code')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update existing profile with github username and return username', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'valid_access_token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              login: 'octocat',
              avatar_url: 'https://github.com/octocat.png',
            }),
        });

      mockPrismaService.profile.findUnique.mockResolvedValueOnce({
        id: 'prof-1',
        userId: 'user-1',
        avatarUrl: 'https://existing.png',
      });
      mockPrismaService.profile.update.mockResolvedValueOnce({
        id: 'prof-1',
        userId: 'user-1',
        githubUsername: 'octocat',
      });

      const result = await service.linkAccount('user-1', 'valid-code');

      expect(result).toEqual({
        username: 'octocat',
        avatarUrl: 'https://github.com/octocat.png',
      });
      expect(mockPrismaService.profile.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: {
          githubUsername: 'octocat',
        },
      });
    });

    it('should create profile if none exists for user', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'valid_access_token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              login: 'newstudent',
              avatar_url: 'https://github.com/newstudent.png',
            }),
        });

      mockPrismaService.profile.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'user-2',
        email: 'student@uni.edu',
      });
      mockPrismaService.profile.create.mockResolvedValueOnce({
        id: 'prof-2',
        userId: 'user-2',
        githubUsername: 'newstudent',
      });

      const result = await service.linkAccount('user-2', 'valid-code');

      expect(result.username).toBe('newstudent');
      expect(mockPrismaService.profile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-2',
          githubUsername: 'newstudent',
        }) as Prisma.ProfileCreateInput,
      });
    });
  });

  describe('getStatsForUsername', () => {
    it('should return fresh cached stats if available within TTL', async () => {
      const cached = {
        username: 'mahin273',
        publicRepos: 10,
        followers: 25,
        contributionsThisYear: 150,
        totalStars: 30,
        topLanguages: ['TypeScript', 'Python'],
        connected: true,
        fetchedAt: Date.now() - 1000 * 60 * 10, // 10 minutes ago (< 1 hr)
      };

      mockPrismaService.profile.findFirst.mockResolvedValueOnce({
        id: 'prof-1',
        githubUsername: 'mahin273',
        githubStats: cached,
      });

      const result = await service.getStatsForUsername('mahin273');

      expect(result.cached).toBe(true);
      expect(result.publicRepos).toBe(10);
      expect(result.totalStars).toBe(30);
    });

    it('should fetch live GitHub stats and compute language rankings when cache is stale', async () => {
      mockPrismaService.profile.findFirst.mockResolvedValueOnce({
        id: 'prof-1',
        githubUsername: 'mahin273',
        githubStats: null,
      });

      const mockUserData = {
        login: 'mahin273',
        public_repos: 3,
        followers: 15,
        avatar_url: 'https://github.com/mahin273.png',
      };
      const mockReposData = [
        { name: 'repo-1', language: 'TypeScript', stargazers_count: 5 },
        { name: 'repo-2', language: 'TypeScript', stargazers_count: 10 },
        { name: 'repo-3', language: 'Python', stargazers_count: 2 },
      ];

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockUserData),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockReposData),
        });

      mockPrismaService.profile.update.mockResolvedValueOnce({});

      const result = await service.getStatsForUsername('mahin273');

      expect(result.username).toBe('mahin273');
      expect(result.publicRepos).toBe(3);
      expect(result.followers).toBe(15);
      expect(result.totalStars).toBe(17);
      expect(result.topLanguages).toEqual(['TypeScript', 'Python']);
      expect(result.cached).toBe(false);
      expect(mockPrismaService.profile.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if GitHub returns 404', async () => {
      mockPrismaService.profile.findFirst.mockResolvedValueOnce(null);

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ message: 'Not Found' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ message: 'Not Found' }),
        });

      await expect(
        service.getStatsForUsername('unknown_user_999'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should serve stale cached stats when GitHub rate limits (403)', async () => {
      const cached = {
        username: 'mahin273',
        publicRepos: 12,
        followers: 30,
        contributionsThisYear: 180,
        totalStars: 40,
        topLanguages: ['TypeScript'],
        connected: true,
        fetchedAt: Date.now() - 1000 * 60 * 120, // 2 hours ago (expired)
      };

      mockPrismaService.profile.findFirst.mockResolvedValueOnce({
        id: 'prof-1',
        githubUsername: 'mahin273',
        githubStats: cached,
      });

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: () => Promise.resolve({ message: 'API rate limit exceeded' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: () => Promise.resolve({ message: 'API rate limit exceeded' }),
        });

      const result = await service.getStatsForUsername('mahin273');

      expect(result.cached).toBe(true);
      expect(result.publicRepos).toBe(12);
      expect(result.warning).toContain('rate-limited');
    });

    it('should return fallback payload when rate limited and no cache exists', async () => {
      mockPrismaService.profile.findFirst.mockResolvedValueOnce(null);

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: () => Promise.resolve({ message: 'API rate limit exceeded' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: () => Promise.resolve({ message: 'API rate limit exceeded' }),
        });

      const result = await service.getStatsForUsername('mahin273');

      expect(result.connected).toBe(true);
      expect(result.publicRepos).toBe(0);
      expect(result.cached).toBe(true);
      expect(result.warning).toBeDefined();
    });
  });

  describe('getStatsForProfile', () => {
    it('should return disconnected stats if profile has no githubUsername', async () => {
      mockPrismaService.profile.findFirst.mockResolvedValueOnce({
        id: 'prof-1',
        githubUsername: null,
      });

      const result = await service.getStatsForProfile('prof-1');

      expect(result.connected).toBe(false);
      expect(result.username).toBeUndefined();
    });

    it('should delegate to getStatsForUsername if profile has githubUsername', async () => {
      mockPrismaService.profile.findFirst.mockResolvedValueOnce({
        id: 'prof-1',
        githubUsername: 'octocat',
        githubStats: {
          username: 'octocat',
          publicRepos: 8,
          connected: true,
          fetchedAt: Date.now(),
        },
      });

      const result = await service.getStatsForProfile('prof-1');
      expect(result.username).toBe('octocat');
      expect(result.connected).toBe(true);
    });
  });
});
