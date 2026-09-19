import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockConfigService = {
    get: jest.fn((key: string, defaultVal: string) => {
      if (key === 'JWT_SECRET') return 'test_jwt_secret';
      return defaultVal;
    }),
  } as unknown as ConfigService;

  beforeEach(() => {
    strategy = new JwtStrategy(mockConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and extract user from valid JWT payload', () => {
    const payload: JwtPayload = {
      sub: 'user-uuid-1',
      email: 'student@uni.edu',
      role: UserRole.STUDENT,
    };

    const user = strategy.validate(payload);

    expect(user).toEqual({
      userId: 'user-uuid-1',
      email: 'student@uni.edu',
      role: UserRole.STUDENT,
    });
  });

  it('should throw UnauthorizedException when payload or sub is missing', () => {
    expect(() => strategy.validate({} as JwtPayload)).toThrow(
      UnauthorizedException,
    );
  });
});
