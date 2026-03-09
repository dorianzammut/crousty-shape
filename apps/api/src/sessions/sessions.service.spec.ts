import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  session: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FAKE_SESSION: any = {
  id: 'sess-1',
  userId: 'user-1',
  exerciseId: 'ex-1',
  reps: 10,
  qualityScore: 85,
  duration: 60,
  createdAt: new Date('2025-03-05T10:00:00Z'),
  exercise: { id: 'ex-1', name: 'Squat' },
  user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
};

describe('SessionsService', () => {
  let service: SessionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    jest.clearAllMocks();
  });

  // ─── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('retourne toutes les sessions', async () => {
      mockPrisma.session.findMany.mockResolvedValue([FAKE_SESSION]);

      const result = await service.findAll();

      expect(result).toEqual([FAKE_SESSION]);
      expect(mockPrisma.session.findMany).toHaveBeenCalled();
    });
  });

  // ─── findByUser ────────────────────────────────────────────────────────────

  describe('findByUser', () => {
    it('retourne les sessions d\'un utilisateur', async () => {
      mockPrisma.session.findMany.mockResolvedValue([FAKE_SESSION]);

      const result = await service.findByUser('user-1');

      expect(result).toEqual([FAKE_SESSION]);
      expect(mockPrisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });

    it('retourne un tableau vide si l\'utilisateur n\'a pas de sessions', async () => {
      mockPrisma.session.findMany.mockResolvedValue([]);

      const result = await service.findByUser('user-no-sessions');

      expect(result).toEqual([]);
    });
  });

  // ─── getWeeklyStats ────────────────────────────────────────────────────────

  describe('getWeeklyStats', () => {
    it('retourne 7 labels (Lun..Dim)', async () => {
      mockPrisma.session.findMany.mockResolvedValue([]);

      const result = await service.getWeeklyStats('user-1');

      expect(result.labels).toEqual(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']);
      expect(result.data).toHaveLength(7);
    });

    it('somme les qualityScores par jour de semaine', async () => {
      // Lundi = index 0 dans le tableau (getDay()=1 → (1+6)%7=0)
      const monday = new Date('2025-03-03T10:00:00Z'); // C'est un lundi
      const sessions = [
        { createdAt: monday, qualityScore: 80 },
        { createdAt: monday, qualityScore: 60 },
      ];
      mockPrisma.session.findMany.mockResolvedValue(sessions);

      const result = await service.getWeeklyStats('user-1');

      expect(result.data[0]).toBe(140); // Lundi : 80 + 60
    });

    it('les autres jours restent à 0 si aucune session', async () => {
      const monday = new Date('2025-03-03T10:00:00Z');
      mockPrisma.session.findMany.mockResolvedValue([{ createdAt: monday, qualityScore: 50 }]);

      const result = await service.getWeeklyStats('user-1');

      // Les 6 autres jours doivent être à 0
      const otherDays = result.data.filter((_, i) => i !== 0);
      expect(otherDays.every(v => v === 0)).toBe(true);
    });

    it('arrondit les qualityScores', async () => {
      const monday = new Date('2025-03-03T10:00:00Z');
      mockPrisma.session.findMany.mockResolvedValue([{ createdAt: monday, qualityScore: 85.7 }]);

      const result = await service.getWeeklyStats('user-1');

      expect(result.data[0]).toBe(86); // Math.round(85.7)
    });

    it('filtre les sessions de la semaine passée', async () => {
      expect(mockPrisma.session.findMany).not.toHaveBeenCalled();
      await service.getWeeklyStats('user-1');

      const callArg = mockPrisma.session.findMany.mock.calls[0][0];
      expect(callArg.where.userId).toBe('user-1');
      expect(callArg.where.createdAt.gte).toBeInstanceOf(Date);
    });
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('crée une session', async () => {
      mockPrisma.session.create.mockResolvedValue(FAKE_SESSION);

      const dto = { userId: 'user-1', exerciseId: 'ex-1', duration: 60, qualityScore: 85 };
      const result = await service.create(dto);

      expect(result).toEqual(FAKE_SESSION);
      expect(mockPrisma.session.create).toHaveBeenCalledWith({ data: dto });
    });
  });
});
