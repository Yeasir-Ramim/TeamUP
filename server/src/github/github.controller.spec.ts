import { Test, TestingModule } from '@nestjs/testing';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

describe('GithubController', () => {
  let controller: GithubController;
  let service: GithubService;

  const mockGithubService = {
    getAuthUrl: jest.fn(),
    linkAccount: jest.fn(),
    getStatsForUsername: jest.fn(),
    getStatsForProfile: jest.fn(),
  };

  const mockUser: AuthenticatedUser = {
    userId: 'user-1',
    email: 'student@uni.edu',
    role: 'STUDENT',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GithubController],
      providers: [{ provide: GithubService, useValue: mockGithubService }],
    }).compile();

    controller = module.get<GithubController>(GithubController);
    service = module.get<GithubService>(GithubService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('getAuthUrl', () => {
    it('should return auth url from service', () => {
      mockGithubService.getAuthUrl.mockReturnValue({
        url: 'https://github.com/login/oauth/authorize?client_id=123',
      });

      const result = controller.getAuthUrl('teamup://callback');
      expect(result).toEqual({
        url: 'https://github.com/login/oauth/authorize?client_id=123',
      });
      expect(mockGithubService.getAuthUrl).toHaveBeenCalledWith(
        'teamup://callback',
      );
    });
  });

  describe('linkGithub', () => {
    it('should link GitHub code to current user account', async () => {
      mockGithubService.linkAccount.mockResolvedValue({
        username: 'octocat',
        avatarUrl: 'https://github.com/octocat.png',
      });

      const result = await controller.linkGithub(mockUser, {
        code: 'code_123',
      });
      expect(result).toEqual({
        username: 'octocat',
        avatarUrl: 'https://github.com/octocat.png',
      });
      expect(mockGithubService.linkAccount).toHaveBeenCalledWith(
        'user-1',
        'code_123',
      );
    });
  });

  describe('getStatsByUsername', () => {
    it('should return stats for requested username', async () => {
      const mockStats = {
        username: 'octocat',
        publicRepos: 8,
        followers: 12,
        contributionsThisYear: 120,
        topLanguages: ['TypeScript'],
        connected: true,
      };
      mockGithubService.getStatsForUsername.mockResolvedValue(mockStats);

      const result = await controller.getStatsByUsername('octocat');
      expect(result).toEqual(mockStats);
      expect(mockGithubService.getStatsForUsername).toHaveBeenCalledWith(
        'octocat',
      );
    });
  });

  describe('getStatsByProfileId', () => {
    it('should return stats for profile ID', async () => {
      const mockStats = {
        username: 'octocat',
        publicRepos: 8,
        followers: 12,
        contributionsThisYear: 120,
        topLanguages: ['TypeScript'],
        connected: true,
      };
      mockGithubService.getStatsForProfile.mockResolvedValue(mockStats);

      const result = await controller.getStatsByProfileId('prof-1');
      expect(result).toEqual(mockStats);
      expect(mockGithubService.getStatsForProfile).toHaveBeenCalledWith(
        'prof-1',
      );
    });
  });
});
