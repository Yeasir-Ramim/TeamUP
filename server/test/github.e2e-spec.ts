import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { JwtService } from '@nestjs/jwt';

describe('GitHub Module (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockUsers = [
    { id: 'user-gh-1', email: 'dev@uni.edu', role: 'STUDENT' },
    { id: 'user-gh-2', email: 'linker@uni.edu', role: 'STUDENT' },
  ];

  const mockProfiles: any[] = [
    {
      id: 'prof-gh-1',
      userId: 'user-gh-1',
      fullName: 'Dev Student',
      githubUsername: 'octocat',
      githubStats: {
        username: 'octocat',
        publicRepos: 15,
        followers: 40,
        contributionsThisYear: 180,
        totalStars: 55,
        topLanguages: ['TypeScript', 'Python'],
        avatarUrl: 'https://github.com/octocat.png',
        connected: true,
        cached: true,
        fetchedAt: Date.now(),
      },
    },
    {
      id: 'prof-gh-2',
      userId: 'user-gh-2',
      fullName: 'Linker Student',
      githubUsername: null,
      githubStats: null,
    },
  ];

  let authTokenUser2: string;
  const originalFetch = global.fetch;

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
    profile: {
      findUnique: jest.fn(
        ({ where }: { where: { userId?: string; id?: string } }) => {
          if (where.userId) {
            return Promise.resolve(
              mockProfiles.find((p) => p.userId === where.userId) || null,
            );
          }
          if (where.id) {
            return Promise.resolve(
              mockProfiles.find((p) => p.id === where.id) || null,
            );
          }
          return Promise.resolve(null);
        },
      ),
      findFirst: jest.fn(({ where }: any) => {
        if (where.githubUsername) {
          return Promise.resolve(
            mockProfiles.find(
              (p) => p.githubUsername === where.githubUsername,
            ) || null,
          );
        }
        const target = where.OR?.[0]?.id || where.id;
        return Promise.resolve(
          mockProfiles.find((p) => p.id === target || p.userId === target) ||
            null,
        );
      }),
      update: jest.fn(({ where, data }: any) => {
        const p = mockProfiles.find(
          (item) => item.userId === where.userId || item.id === where.id,
        );
        if (p) {
          Object.assign(p, data);
          return Promise.resolve(p);
        }
        return Promise.resolve(null);
      }),
      create: jest.fn(({ data }: any) => {
        const p = { id: `prof-gh-${mockProfiles.length + 1}`, ...data };
        mockProfiles.push(p);
        return Promise.resolve(p);
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
    authTokenUser2 = await jwtService.signAsync(
      { sub: 'user-gh-2', email: 'linker@uni.edu', role: 'STUDENT' },
      {
        secret:
          process.env.JWT_SECRET || 'super_secret_jwt_access_key_teamup_2026',
      },
    );

    await app.init();
  });

  afterAll(async () => {
    global.fetch = originalFetch;
    await app.close();
  });

  describe('GET /api/v1/github/auth-url', () => {
    it('should return OAuth authorization url inside standard response envelope', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/github/auth-url')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toContain(
        'https://github.com/login/oauth/authorize',
      );
      expect(res.body.data.url).toContain('client_id=');
    });

    it('should encode redirectUri when provided as query param', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/github/auth-url?redirectUri=teamup://oauth-callback')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toContain(
        'redirect_uri=teamup%3A%2F%2Foauth-callback',
      );
    });
  });

  describe('POST /api/v1/github/link', () => {
    it('should reject unauthenticated request with 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/github/link')
        .send({ code: 'gh_code_123' })
        .expect(401);
    });

    it('should reject invalid payload missing code with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/github/link')
        .set('Authorization', `Bearer ${authTokenUser2}`)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should link GitHub account when valid code is provided', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'gh_access_token_123' }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            login: 'devstudent',
            avatar_url: 'https://github.com/devstudent.png',
          }),
        } as any);

      const res = await request(app.getHttpServer())
        .post('/api/v1/github/link')
        .set('Authorization', `Bearer ${authTokenUser2}`)
        .send({ code: 'valid_oauth_code' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('devstudent');
      expect(res.body.data.avatarUrl).toBe('https://github.com/devstudent.png');
    });
  });

  describe('GET /api/v1/github/stats/:username', () => {
    it('should return cached stats for existing username', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/github/stats/octocat')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('octocat');
      expect(res.body.data.publicRepos).toBe(15);
      expect(res.body.data.cached).toBe(true);
      expect(res.body.data.topLanguages).toContain('TypeScript');
    });
  });

  describe('GET /api/v1/github/profile/:profileId', () => {
    it('should return GitHub stats by profile ID', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/github/profile/prof-gh-1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('octocat');
      expect(res.body.data.connected).toBe(true);
    });
  });

  describe('GET /api/v1/profiles/:id/github (Frontend Card Integration)', () => {
    it('should return GitHub stats matching GitHubStatsCard component expectations', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/profiles/prof-gh-1/github')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('octocat');
      expect(res.body.data.connected).toBe(true);
      expect(res.body.data.publicRepos).toBe(15);
      expect(res.body.data.followers).toBe(40);
      expect(res.body.data.topLanguages).toEqual(['TypeScript', 'Python']);
    });
  });
});
