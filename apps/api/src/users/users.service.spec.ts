import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

const FAKE_USER = {
  id: 'user-1',
  email: 'alice@example.com',
  name: 'Alice',
  role: 'USER',
  password: 'hashed',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  session: {
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  alert: {
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('crée un utilisateur et retourne ses données', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(FAKE_USER);

      const result = await service.create({
        email: 'alice@example.com',
        name: 'Alice',
        password: 'password123',
        role: 'USER',
      });

      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(result).toEqual(FAKE_USER);
    });

    it('hash le mot de passe avant création', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(FAKE_USER);

      await service.create({ email: 'alice@example.com', name: 'Alice', password: 'plain', role: 'USER' });

      const createArg = mockPrisma.user.create.mock.calls[0][0];
      expect(createArg.data.password).not.toBe('plain');
      expect(await bcrypt.compare('plain', createArg.data.password)).toBe(true);
    });

    it('lève ConflictException si l\'email existe déjà', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(FAKE_USER);

      await expect(
        service.create({ email: 'alice@example.com', name: 'Alice', password: 'pass', role: 'USER' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('retourne tous les utilisateurs', async () => {
      mockPrisma.user.findMany.mockResolvedValue([FAKE_USER]);

      const result = await service.findAll();

      expect(result).toEqual([FAKE_USER]);
      expect(mockPrisma.user.findMany).toHaveBeenCalled();
    });
  });

  // ─── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('retourne l\'utilisateur trouvé', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(FAKE_USER);

      const result = await service.findOne('user-1');

      expect(result).toEqual(FAKE_USER);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'user-1' } }));
    });

    it('lève NotFoundException si l\'utilisateur n\'existe pas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update / updateMe ─────────────────────────────────────────────────────

  describe('update', () => {
    it('met à jour et retourne l\'utilisateur', async () => {
      const updated = { ...FAKE_USER, name: 'Alice V2' };
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await service.update('user-1', { name: 'Alice V2' });

      expect(result.name).toBe('Alice V2');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'user-1' } }));
    });
  });

  describe('updateMe', () => {
    it('met à jour le profil de l\'utilisateur connecté', async () => {
      const updated = { ...FAKE_USER, name: 'Alice Updated' };
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await service.updateMe('user-1', { name: 'Alice Updated' });

      expect(result.name).toBe('Alice Updated');
    });
  });

  // ─── changePassword ────────────────────────────────────────────────────────

  describe('changePassword', () => {
    it('change le mot de passe avec succès', async () => {
      const hash = await bcrypt.hash('oldpass', 10);
      mockPrisma.user.findUnique.mockResolvedValue({ ...FAKE_USER, password: hash });
      mockPrisma.user.update.mockResolvedValue(FAKE_USER);

      await service.changePassword('user-1', { currentPassword: 'oldpass', newPassword: 'newpass' });

      const updateArg = mockPrisma.user.update.mock.calls[0][0];
      expect(await bcrypt.compare('newpass', updateArg.data.password)).toBe(true);
    });

    it('lève NotFoundException si l\'utilisateur n\'existe pas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword('unknown', { currentPassword: 'old', newPassword: 'new' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lève ForbiddenException si le mot de passe actuel est incorrect', async () => {
      const hash = await bcrypt.hash('correct', 10);
      mockPrisma.user.findUnique.mockResolvedValue({ ...FAKE_USER, password: hash });

      await expect(
        service.changePassword('user-1', { currentPassword: 'wrong', newPassword: 'new' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── remove ────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('supprime l\'utilisateur et ses données liées', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(FAKE_USER);
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.alert.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.user.delete.mockResolvedValue(FAKE_USER);

      const result = await service.remove('user-1');

      expect(result).toEqual({ deleted: true });
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(mockPrisma.alert.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });

    it('lève NotFoundException si l\'utilisateur n\'existe pas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('unknown')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });
  });

  // ─── getStats ──────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('retourne les statistiques globales', async () => {
      mockPrisma.user.count.mockResolvedValue(10);
      mockPrisma.session.count.mockResolvedValue(50);
      mockPrisma.alert.count.mockResolvedValue(3);

      const result = await service.getStats();

      expect(result).toEqual({ users: 10, sessions: 50, alerts: 3 });
    });
  });

  // ─── getGrowth ─────────────────────────────────────────────────────────────

  describe('getGrowth', () => {
    const usersData = [
      { createdAt: new Date('2020-01-01') },
      { createdAt: new Date('2023-06-15') },
      { createdAt: new Date('2025-01-10') },
    ];

    beforeEach(() => {
      mockPrisma.user.findMany.mockResolvedValue(usersData);
    });

    it('retourne 7 buckets pour "week"', async () => {
      const result = await service.getGrowth('week');
      expect(result.labels).toHaveLength(7);
      expect(result.data).toHaveLength(7);
    });

    it('retourne 5 buckets pour "month"', async () => {
      const result = await service.getGrowth('month');
      expect(result.labels).toHaveLength(5);
      expect(result.data).toHaveLength(5);
    });

    it('retourne 12 buckets pour "year"', async () => {
      const result = await service.getGrowth('year');
      expect(result.labels).toHaveLength(12);
      expect(result.data).toHaveLength(12);
    });

    it('retourne 5 buckets pour "5years"', async () => {
      const result = await service.getGrowth('5years');
      expect(result.labels).toHaveLength(5);
      expect(result.data).toHaveLength(5);
    });

    it('utilise "month" par défaut pour une valeur inconnue', async () => {
      const result = await service.getGrowth('unknown');
      expect(result.labels).toHaveLength(5);
    });

    it('les données sont cumulatives (croissantes)', async () => {
      const result = await service.getGrowth('5years');
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i]).toBeGreaterThanOrEqual(result.data[i - 1]);
      }
    });
  });
});
