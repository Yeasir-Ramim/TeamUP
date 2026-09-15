/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { JwtService } from '@nestjs/jwt';

describe('Community Idea Hub (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authorToken: string;
  let collaboratorToken: string;

  const mockUsers = [
    {
      id: 'user-author',
      email: 'author@uni.edu',
      role: 'STUDENT',
      profile: { fullName: 'Author Alice' },
    },
    {
      id: 'user-collab',
      email: 'collab@uni.edu',
      role: 'STUDENT',
      profile: { fullName: 'Collaborator Bob' },
    },
  ];

  const mockIdeas: any[] = [
    {
      id: 'idea-1',
      title: 'Autonomous Drone Delivery',
      description:
        'Building an autonomous delivery drone using ROS 2 and Gazebo simulator',
      domain: 'Robotics',
      suggestedStack: ['ROS 2', 'Python', 'C++'],
      authorId: 'user-author',
      createdAt: new Date('2026-09-10T10:00:00.000Z'),
      updatedAt: new Date('2026-09-10T10:00:00.000Z'),
      author: {
        id: 'user-author',
        email: 'author@uni.edu',
        role: 'STUDENT',
        profile: {
          fullName: 'Author Alice',
          avatarUrl: null,
          bio: 'Robotics enthusiast',
          department: 'Computer Science',
        },
      },
    },
  ];

  const mockNotifications: any[] = [];

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
    idea: {
      create: jest.fn(({ data }: any) => {
        const newIdea = {
          id: `idea-${Date.now()}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            id: data.authorId,
            email: 'author@uni.edu',
            role: 'STUDENT',
            profile: {
              fullName: 'Author Alice',
              avatarUrl: null,
              bio: null,
              department: null,
            },
          },
        };
        mockIdeas.push(newIdea);
        return Promise.resolve(newIdea);
      }),
      count: jest.fn(() => Promise.resolve(mockIdeas.length)),
      findMany: jest.fn(({ where, skip = 0, take = 20 }: any) => {
        let list = [...mockIdeas];
        if (where?.domain?.equals) {
          list = list.filter(
            (i) => i.domain.toLowerCase() === where.domain.equals.toLowerCase(),
          );
        }
        if (where?.suggestedStack?.hasSome) {
          const required = where.suggestedStack.hasSome[0];
          list = list.filter((i) => i.suggestedStack.includes(required));
        }
        return Promise.resolve(list.slice(skip, skip + take));
      }),
      findUnique: jest.fn(({ where }: { where: { id: string } }) => {
        const found = mockIdeas.find((i) => i.id === where.id);
        return Promise.resolve(found || null);
      }),
      update: jest.fn(({ where, data }: any) => {
        const idx = mockIdeas.findIndex((i) => i.id === where.id);
        if (idx === -1) return Promise.resolve(null);
        mockIdeas[idx] = {
          ...mockIdeas[idx],
          ...data,
          updatedAt: new Date(),
        };
        return Promise.resolve(mockIdeas[idx]);
      }),
      delete: jest.fn(({ where }: { where: { id: string } }) => {
        const idx = mockIdeas.findIndex((i) => i.id === where.id);
        if (idx !== -1) {
          const removed = mockIdeas.splice(idx, 1)[0];
          return Promise.resolve(removed);
        }
        return Promise.resolve({ id: where.id });
      }),
    },
    notification: {
      create: jest.fn(({ data }: any) => {
        const notif = { id: `notif-${Date.now()}`, ...data };
        mockNotifications.push(notif);
        return Promise.resolve(notif);
      }),
    },
    pushToken: {
      findMany: jest.fn(() => Promise.resolve([])),
      deleteMany: jest.fn(() => Promise.resolve({ count: 0 })),
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
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    const jwtSecret =
      process.env.JWT_SECRET || 'super_secret_jwt_access_key_teamup_2026';

    authorToken = await jwtService.signAsync(
      {
        sub: 'user-author',
        email: 'author@uni.edu',
        role: 'STUDENT',
      },
      { secret: jwtSecret },
    );
    collaboratorToken = await jwtService.signAsync(
      {
        sub: 'user-collab',
        email: 'collab@uni.edu',
        role: 'STUDENT',
      },
      { secret: jwtSecret },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/ideas', () => {
    it('should reject unauthenticated requests with 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/ideas')
        .send({
          title: 'Unauthenticated Idea',
          description: 'This should fail authentication completely',
          domain: 'AI',
        })
        .expect(401);
    });

    it('should reject invalid payload with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ideas')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'ab', // Min 3
          description: 'too short', // Min 10
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should create an idea and return 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ideas')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          title: 'Campus Food Sharing Network',
          description:
            'Redistribute surplus cafeteria food across student dorms',
          domain: 'Sustainability',
          suggestedStack: ['Next.js', 'PostgreSQL', 'TailwindCSS'],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Campus Food Sharing Network');
      expect(res.body.data.domain).toBe('Sustainability');
      expect(res.body.data.suggestedStack).toEqual([
        'Next.js',
        'PostgreSQL',
        'TailwindCSS',
      ]);
    });
  });

  describe('GET /api/v1/ideas', () => {
    it('should return paginated ideas list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/ideas')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.ideas)).toBe(true);
      expect(res.body.data.meta).toBeDefined();
    });

    it('should filter ideas by domain', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/ideas?domain=Robotics')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.ideas.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.ideas[0].domain).toBe('Robotics');
    });

    it('should filter ideas by tech tag', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/ideas?tag=ROS 2')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.ideas.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.ideas[0].suggestedStack).toContain('ROS 2');
    });
  });

  describe('GET /api/v1/ideas/:id', () => {
    it('should return idea details by ID', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/ideas/idea-1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('idea-1');
      expect(res.body.data.author.email).toBe('author@uni.edu');
    });

    it('should return 404 for non-existent idea', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/ideas/non-existent-id')
        .expect(404);
    });
  });

  describe('PATCH /api/v1/ideas/:id', () => {
    it('should reject unauthorized edits with 403', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/ideas/idea-1')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({ title: 'Unauthorized Modification' })
        .expect(403);
    });

    it('should allow author to update idea', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/ideas/idea-1')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ title: 'Updated Autonomous Drone Delivery' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Autonomous Drone Delivery');
    });
  });

  describe('POST /api/v1/ideas/:id/interest', () => {
    it('should reject author expressing interest in own idea with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ideas/idea-1/interest')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({ message: 'I love my own idea!' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('own idea');
    });

    it('should allow collaborator to express interest and dispatch notification', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ideas/idea-1/interest')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({ message: 'I have extensive robotics and ROS experience.' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Interest expressed successfully');
      expect(mockNotifications.length).toBeGreaterThan(0);
      expect(mockNotifications[mockNotifications.length - 1].type).toBe(
        'IDEA_INTEREST',
      );
    });
  });

  describe('DELETE /api/v1/ideas/:id', () => {
    it('should reject deletion by non-author with 403', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/ideas/idea-1')
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .expect(403);
    });

    it('should allow author to delete idea', async () => {
      const res = await request(app.getHttpServer())
        .delete('/api/v1/ideas/idea-1')
        .set('Authorization', `Bearer ${authorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Idea deleted successfully');
    });
  });
});
