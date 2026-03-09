import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  alert: {
    findMany: jest.fn(),
  },
};

const FAKE_ALERT = {
  id: 'alert-1',
  userId: 'user-1',
  exerciseId: 'ex-1',
  message: 'Mauvaise posture détectée',
  type: 'WARNING',
  createdAt: new Date(),
  user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
  exercise: { id: 'ex-1', name: 'Squat' },
};

describe('AlertsService', () => {
  let service: AlertsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    jest.clearAllMocks();
  });

  // ─── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('retourne toutes les alertes avec user et exercise inclus', async () => {
      mockPrisma.alert.findMany.mockResolvedValue([FAKE_ALERT]);

      const result = await service.findAll();

      expect(result).toEqual([FAKE_ALERT]);
      expect(mockPrisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            user: expect.anything(),
            exercise: true,
          }),
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('retourne un tableau vide si aucune alerte', async () => {
      mockPrisma.alert.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ─── findByUser ────────────────────────────────────────────────────────────

  describe('findByUser', () => {
    it('retourne les alertes d\'un utilisateur', async () => {
      mockPrisma.alert.findMany.mockResolvedValue([FAKE_ALERT]);

      const result = await service.findByUser('user-1');

      expect(result).toEqual([FAKE_ALERT]);
      expect(mockPrisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });

    it('retourne un tableau vide si l\'utilisateur n\'a pas d\'alertes', async () => {
      mockPrisma.alert.findMany.mockResolvedValue([]);

      const result = await service.findByUser('user-no-alerts');

      expect(result).toEqual([]);
    });
  });
});
