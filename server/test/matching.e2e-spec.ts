import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { JwtService } from '@nestjs/jwt';
import { ExperienceLevel, MemberStatus } from '@prisma/client';

describe('Skill-Based Matching Engine (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockUsers = [
    { id: 'user-creator', email: 'leader@uni.edu', role: 'STUDENT' },
    { id: 'user-member', email: 'member@uni.edu', role: 'STUDENT' },
    { id: 'user-candidate-1', email: 'candidate1@uni.edu', role: 'STUDENT' },
    { id: 'user-candidate-2', email: 'candidate2@uni.edu', role: 'STUDENT' },
  ];

  const mockSkills = [
    { id: 'skill-react', name: 'React', category: 'Frontend' },
    { id: 'skill-node', name: 'Node.js', category: 'Backend' },
  ];

  const mockProjects = [
    {
      id: 'proj-match-1',
      title: 'AI Study Group Finder',
      creatorId: 'user-creator',
      requiredSkills: [
        {
          id: 'prs-1',
          skillId: 'skill-react',
          minimumExperience: ExperienceLevel.INTERMEDIATE,
          skill: mockSkills[0],
        },
        {
          id: 'prs-2',
          skillId: 'skill-node',
          minimumExperience: ExperienceLevel.BEGINNER,
          skill: mockSkills[1],
        },
      ],
      members: [
        { userId: 'user-member', status: MemberStatus.ACCEPTED },
        { userId: 'user-candidate-2', status: MemberStatus.PENDING },
      ],
    },
  ];

  const mockProfiles = [
    {
      id: 'prof-creator',
      userId: 'user-creator',
      fullName: 'Project Leader',
      availability: true,
      skills: [],
    },
    {
      id: 'prof-member',
      userId: 'user-member',
      fullName: 'Existing Member',
      availability: true,
      skills: [],
    },
    {
      id: 'prof-cand-1',
      userId: 'user-candidate-1',
      fullName: 'Top Candidate',
      avatarUrl: 'https://avatar.png',
      bio: 'Fullstack developer',
      department: 'CSE',
      semester: 'Fall 2026',
      availability: true,
      experienceLevel: ExperienceLevel.ADVANCED,
      githubUsername: 'topcoder',
      githubStats: { publicRepos: 18, contributionsThisYear: 240 },
      user: {
        id: 'user-candidate-1',
        email: 'candidate1@uni.edu',
        evaluationsReceived: [{ score: 4.8 }, { score: 5.0 }],
      },
      skills: [
        {
          id: 'ps-1',
          skillId: 'skill-react',
          proficiencyLevel: ExperienceLevel.ADVANCED,
          skill: mockSkills[0],
        },
        {
          id: 'ps-2',
          skillId: 'skill-node',
          proficiencyLevel: ExperienceLevel.INTERMEDIATE,
          skill: mockSkills[1],
        },
      ],
    },
    {
      id: 'prof-cand-2',
      userId: 'user-candidate-2',
      fullName: 'Invited Candidate',
      availability: true,
      experienceLevel: ExperienceLevel.BEGINNER,
      githubUsername: null,
      githubStats: null,
      user: {
        id: 'user-candidate-2',
        email: 'candidate2@uni.edu',
        evaluationsReceived: [],
      },
      skills: [
        {
          id: 'ps-3',
          skillId: 'skill-react',
          proficiencyLevel: ExperienceLevel.BEGINNER,
          skill: mockSkills[0],
        },
      ],
    },
  ];

  let authToken: string;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(
        ({ where }: { where: { id?: string; email?: string } }) => {
          if (where.id) {
            return Promise.resolve(
              mockUsers.find((u) => u.id === where.id) || null,
            );
          }
          if (where.email) {
            return Promise.resolve(
              mockUsers.find((u) => u.email === where.email) || null,
            );
          }
          return Promise.resolve(null);
        },
      ),
    },
    project: {
      findUnique: jest.fn(({ where }: any) => {
        return Promise.resolve(
          mockProjects.find((p) => p.id === where.id) || null,
        );
      }),
    },
    profile: {
      findMany: jest.fn(({ where }: any) => {
        const notInList: string[] = where?.userId?.notIn || [];
        const filtered = mockProfiles.filter(
          (p) => !notInList.includes(p.userId),
        );
        return Promise.resolve(filtered);
      }),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = await jwtService.signAsync(
      { sub: 'user-creator', email: 'leader@uni.edu', role: 'STUDENT' },
      {
        secret:
          process.env.JWT_SECRET || 'super_secret_jwt_access_key_teamup_2026',
      },
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/projects/:id/recommendations', () => {
    it('should reject unauthenticated request with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/projects/proj-match-1/recommendations')
        .expect(401);
    });

    it('should return 404 if project does not exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects/unknown-proj/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should return ranked teammate recommendations with multi-factor match scores', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects/proj-match-1/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);

      const [topCandidate, secondCandidate] = res.body.data;

      // Top Candidate verification
      expect(topCandidate.fullName).toBe('Top Candidate');
      expect(topCandidate.matchScore).toBeGreaterThanOrEqual(90);
      expect(topCandidate.matchingSkills).toEqual(['React', 'Node.js']);
      expect(topCandidate.invited).toBe(false);
      expect(topCandidate.publicRepos).toBe(18);

      // Second Candidate verification (pending invite flag)
      expect(secondCandidate.fullName).toBe('Invited Candidate');
      expect(secondCandidate.matchingSkills).toEqual(['React']);
      expect(secondCandidate.invited).toBe(true);
      expect(secondCandidate.matchScore).toBeLessThan(topCandidate.matchScore);
    });
  });

  describe('GET /api/v1/matching/recommendations/:projectId', () => {
    it('should also serve recommendations via MatchingController', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/matching/recommendations/proj-match-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].fullName).toBe('Top Candidate');
    });
  });
});
