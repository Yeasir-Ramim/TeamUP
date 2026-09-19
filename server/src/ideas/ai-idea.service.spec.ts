import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExperienceLevel } from '@prisma/client';
import { AiIdeaService } from './ai-idea.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AiIdeaService', () => {
  let service: AiIdeaService;

  const mockPrismaService = {
    cachedIdeaQuery: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'LLM_API_KEY') return 'your_llm_api_key';
      if (key === 'LLM_CACHE_TTL_HOURS') return '24';
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiIdeaService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AiIdeaService>(AiIdeaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('computeHash', () => {
    it('should generate identical hashes regardless of tech stack order or casing', () => {
      const hash1 = service.computeHash(
        'Fintech',
        ['React Native', 'NestJS'],
        'INTERMEDIATE',
      );
      const hash2 = service.computeHash(
        '  fintech ',
        ['nestjs', 'react native'],
        'intermediate',
      );

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex length
    });

    it('should generate different hashes for different domains', () => {
      const hash1 = service.computeHash(
        'Fintech',
        ['React Native'],
        'BEGINNER',
      );
      const hash2 = service.computeHash(
        'Healthcare',
        ['React Native'],
        'BEGINNER',
      );

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateIdea - Cache Hit', () => {
    it('should return cached idea with isCached: true when cache is valid', async () => {
      const cachedResult = {
        id: 'cached-1',
        title: 'Cached Fintech App',
        description: 'Existing cached description',
        problem: 'Existing cached problem',
        domain: 'Fintech',
        techStack: ['React Native', 'NestJS'],
        difficulty: ExperienceLevel.INTERMEDIATE,
        estimatedDuration: '4-6 weeks',
        teamSize: '3-4 members',
        features: ['OCR scanning'],
        roadmap: ['Phase 1'],
      };

      mockPrismaService.cachedIdeaQuery.findUnique.mockResolvedValue({
        id: 'db-cache-1',
        queryHash: 'some-hash',
        domain: 'Fintech',
        techInterest: 'NestJS, React Native',
        resultJson: cachedResult,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // Valid for 1 hour
      });

      const result = await service.generateIdea({
        domain: 'Fintech',
        techStack: ['React Native', 'NestJS'],
        difficulty: ExperienceLevel.INTERMEDIATE,
      });

      expect(result.title).toBe('Cached Fintech App');
      expect(result.isCached).toBe(true);
      expect(mockPrismaService.cachedIdeaQuery.upsert).not.toHaveBeenCalled();
    });
  });

  describe('generateIdea - Cache Miss', () => {
    it('should generate procedural idea and persist to cache when cache misses', async () => {
      mockPrismaService.cachedIdeaQuery.findUnique.mockResolvedValue(null);
      mockPrismaService.cachedIdeaQuery.upsert.mockResolvedValue({});

      const result = await service.generateIdea({
        domain: 'Fintech',
        techStack: ['React Native', 'NestJS'],
        difficulty: ExperienceLevel.INTERMEDIATE,
      });

      expect(result.domain).toBe('Fintech');
      expect(result.techStack).toContain('React Native');
      expect(result.techStack).toContain('NestJS');
      expect(result.difficulty).toBe(ExperienceLevel.INTERMEDIATE);
      expect(result.features.length).toBeGreaterThan(0);
      expect(result.roadmap.length).toBeGreaterThan(0);
      expect(result.isCached).toBe(false);

      expect(mockPrismaService.cachedIdeaQuery.upsert).toHaveBeenCalledWith({
        where: { queryHash: expect.any(String) },
        create: expect.objectContaining({
          domain: 'Fintech',
          resultJson: expect.objectContaining({
            domain: 'Fintech',
          }),
        }),
        update: expect.any(Object),
      });
    });
  });

  describe('generateIdea - Failure Handling', () => {
    it('should throw ServiceUnavailableException when simulateFailure is true', async () => {
      await expect(
        service.generateIdea({
          domain: 'AI',
          simulateFailure: true,
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('cleanExpiredCache', () => {
    it('should delete expired records and return count', async () => {
      mockPrismaService.cachedIdeaQuery.deleteMany.mockResolvedValue({
        count: 5,
      });

      const res = await service.cleanExpiredCache();
      expect(res).toEqual({ count: 5 });
      expect(mockPrismaService.cachedIdeaQuery.deleteMany).toHaveBeenCalledWith(
        {
          where: {
            expiresAt: {
              lt: expect.any(Date),
            },
          },
        },
      );
    });
  });
});
