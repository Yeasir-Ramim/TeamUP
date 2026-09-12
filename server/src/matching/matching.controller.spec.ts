import { Test, TestingModule } from '@nestjs/testing';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '@prisma/client';

describe('MatchingController', () => {
  let controller: MatchingController;
  let service: MatchingService;

  const mockMatchingService = {
    getRecommendations: jest.fn(),
  };

  const mockUser: AuthenticatedUser = {
    userId: 'user-leader-1',
    email: 'leader@uni.edu',
    role: UserRole.STUDENT,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchingController],
      providers: [{ provide: MatchingService, useValue: mockMatchingService }],
    }).compile();

    controller = module.get<MatchingController>(MatchingController);
    service = module.get<MatchingService>(MatchingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('getRecommendations', () => {
    it('should delegate to matchingService.getRecommendations', async () => {
      const mockCandidates = [
        {
          id: 'prof-1',
          userId: 'user-1',
          fullName: 'Alice',
          matchScore: 95,
          matchingSkills: ['TypeScript'],
          skills: [{ id: 's-1', skillName: 'TypeScript' }],
          invited: false,
        },
      ];

      mockMatchingService.getRecommendations.mockResolvedValue(mockCandidates);

      const result = await controller.getRecommendations('proj-1', mockUser);
      expect(result).toEqual(mockCandidates);
      expect(mockMatchingService.getRecommendations).toHaveBeenCalledWith(
        'proj-1',
        'user-leader-1',
      );
    });
  });
});
