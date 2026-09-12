import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectStatus } from '@prisma/client';

describe('ProjectsService - Search & Multi-criteria Filters', () => {
  let service: ProjectsService;

  const mockPrismaService = {
    project: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should build dynamic WHERE clause with keyword and faceted filters', async () => {
      const mockRawProjects = [
        {
          id: 'proj-1',
          title: 'AI Study Group Finder',
          description: 'A platform to form study groups',
          domain: 'Education',
          semester: 'Fall 2026',
          status: ProjectStatus.OPEN,
          maxMembers: 4,
          createdAt: new Date('2026-09-01'),
          creator: {
            id: 'user-1',
            email: 'leader@uni.edu',
            profile: {
              fullName: 'Alice Leader',
              avatarUrl: 'https://avatar.png',
            },
          },
          requiredSkills: [
            { skill: { name: 'React Native' } },
            { skill: { name: 'NestJS' } },
          ],
          members: [{ id: 'm-1' }, { id: 'm-2' }],
          _count: { members: 2 },
        },
      ];

      mockPrismaService.project.findMany.mockResolvedValue(mockRawProjects);

      const result = await service.search({
        search: 'study group',
        domain: 'Education',
        semester: 'Fall 2026',
        status: ProjectStatus.OPEN,
        tech: 'NestJS',
        page: 1,
        limit: 20,
      });

      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'study group', mode: 'insensitive' } },
            { description: { contains: 'study group', mode: 'insensitive' } },
            { domain: { contains: 'study group', mode: 'insensitive' } },
          ],
          domain: { contains: 'Education', mode: 'insensitive' },
          semester: { contains: 'Fall 2026', mode: 'insensitive' },
          status: ProjectStatus.OPEN,
          requiredSkills: {
            some: {
              skill: {
                name: { contains: 'NestJS', mode: 'insensitive' },
              },
            },
          },
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });

      // Verify normalization to ProjectListing contract
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'proj-1',
        title: 'AI Study Group Finder',
        description: 'A platform to form study groups',
        domain: 'Education',
        semester: 'Fall 2026',
        status: ProjectStatus.OPEN,
        requiredSkills: ['React Native', 'NestJS'],
        ownerName: 'Alice Leader',
        memberCount: 2,
        maxMembers: 4,
        createdAt: new Date('2026-09-01'),
      });
    });

    it('should ignore "All" values in domain, semester, status, and tech filters', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);

      const result = await service.search({
        domain: 'All',
        semester: 'All',
        status: 'All' as any,
        tech: 'All',
      });

      expect(result).toEqual([]);
      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should fallback ownerName to email username if profile fullName is missing', async () => {
      const mockRawProjects = [
        {
          id: 'proj-2',
          title: 'Robotics Team',
          description: 'Autonomous rover project',
          domain: 'Robotics',
          semester: 'Spring 2026',
          status: ProjectStatus.OPEN,
          maxMembers: 5,
          createdAt: new Date('2026-09-02'),
          creator: {
            id: 'user-2',
            email: 'bob.builder@uni.edu',
            profile: null,
          },
          requiredSkills: [],
          members: [],
          _count: { members: 0 },
        },
      ];

      mockPrismaService.project.findMany.mockResolvedValue(mockRawProjects);

      const result = await service.search({});

      expect(result[0].ownerName).toBe('bob.builder');
      expect(result[0].requiredSkills).toEqual([]);
      expect(result[0].memberCount).toBe(0);
    });
  });
});
