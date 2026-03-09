import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('signed.token'),
};

const FAKE_USER = {
  id: 'user-1',
  email: 'alice@example.com',
  name: 'Alice',
  role: 'USER',
  password: 'hashed',
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    mockJwt.sign.mockReturnValue('signed.token');
  });

  // ─── register ──────────────────────────────────────────────────────────────

  describe('register', () => {
    it('crée un utilisateur et retourne un token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(FAKE_USER);

      const result = await service.register({
        email: 'alice@example.com',
        name: 'Alice',
        password: 'password123',
      });

      expect(result).toEqual({
        access_token: 'signed.token',
        user: { id: 'user-1', email: 'alice@example.com', name: 'Alice', role: 'USER' },
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'alice@example.com' } });
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockJwt.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'alice@example.com',
        name: 'Alice',
        role: 'USER',
      });
    });

    it('hash le mot de passe avant de créer l\'utilisateur', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(FAKE_USER);

      await service.register({ email: 'alice@example.com', name: 'Alice', password: 'plaintext' });

      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.password).not.toBe('plaintext');
      expect(await bcrypt.compare('plaintext', createCall.data.password)).toBe(true);
    });

    it('lève ConflictException si l\'email existe déjà', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(FAKE_USER);

      await expect(
        service.register({ email: 'alice@example.com', name: 'Alice', password: 'pass' }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  // ─── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('retourne un token avec des credentials valides', async () => {
      const hash = await bcrypt.hash('password123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({ ...FAKE_USER, password: hash });

      const result = await service.login({ email: 'alice@example.com', password: 'password123' });

      expect(result).toHaveProperty('access_token', 'signed.token');
      expect(result.user.email).toBe('alice@example.com');
    });

    it('lève UnauthorizedException si l\'email n\'existe pas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lève UnauthorizedException si le mot de passe est incorrect', async () => {
      const hash = await bcrypt.hash('correct', 10);
      mockPrisma.user.findUnique.mockResolvedValue({ ...FAKE_USER, password: hash });

      await expect(
        service.login({ email: 'alice@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('ne génère pas de token en cas d\'échec', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await service.login({ email: 'unknown@example.com', password: 'pass' }).catch(() => {});

      expect(mockJwt.sign).not.toHaveBeenCalled();
    });
  });
});
