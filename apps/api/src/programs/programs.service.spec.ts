import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { PrismaService } from '../prisma/prisma.service';

const FAKE_PROGRAM = {
  id: 'prog-1',
  userId: 'user-1',
  name: 'Push Day',
  description: 'Chest and triceps',
  createdAt: new Date(),
};

const mockPrisma = {
  program: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  programExercise: {
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe('ProgramsService', () => {
  let service: ProgramsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProgramsService>(ProgramsService);
    jest.clearAllMocks();
  });

  // ─── getMyPrograms ─────────────────────────────────────────────────────────

  describe('getMyPrograms', () => {
    it('retourne les programmes de l\'utilisateur', async () => {
      mockPrisma.program.findMany.mockResolvedValue([FAKE_PROGRAM]);

      const result = await service.getMyPrograms('user-1');

      expect(result).toEqual([FAKE_PROGRAM]);
      expect(mockPrisma.program.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('crée un programme', async () => {
      mockPrisma.program.create.mockResolvedValue(FAKE_PROGRAM);

      const result = await service.create('user-1', { name: 'Push Day', description: 'Chest and triceps' });

      expect(result).toEqual(FAKE_PROGRAM);
      expect(mockPrisma.program.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1', name: 'Push Day' }) }),
      );
    });
  });

  // ─── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('supprime un programme appartenant à l\'utilisateur', async () => {
      mockPrisma.program.findUnique.mockResolvedValue(FAKE_PROGRAM);
      mockPrisma.program.delete.mockResolvedValue(FAKE_PROGRAM);

      await service.delete('user-1', 'prog-1');

      expect(mockPrisma.program.delete).toHaveBeenCalledWith({ where: { id: 'prog-1' } });
    });

    it('lève ForbiddenException si le programme n\'existe pas', async () => {
      mockPrisma.program.findUnique.mockResolvedValue(null);

      await expect(service.delete('user-1', 'prog-unknown')).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.program.delete).not.toHaveBeenCalled();
    });

    it('lève ForbiddenException si le programme appartient à un autre utilisateur', async () => {
      mockPrisma.program.findUnique.mockResolvedValue({ ...FAKE_PROGRAM, userId: 'other-user' });

      await expect(service.delete('user-1', 'prog-1')).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.program.delete).not.toHaveBeenCalled();
    });
  });

  // ─── addExercise ───────────────────────────────────────────────────────────

  describe('addExercise', () => {
    it('ajoute un exercice au programme avec les valeurs par défaut', async () => {
      mockPrisma.program.findUnique.mockResolvedValue(FAKE_PROGRAM);
      mockPrisma.programExercise.count.mockResolvedValue(2); // ordre = 2
      mockPrisma.programExercise.create.mockResolvedValue({ id: 'pe-1', sets: 3, reps: 10, order: 2 });

      const result = await service.addExercise('user-1', 'prog-1', { exerciseId: 'ex-1' });

      const createArg = mockPrisma.programExercise.create.mock.calls[0][0];
      expect(createArg.data.sets).toBe(3);
      expect(createArg.data.reps).toBe(10);
      expect(createArg.data.order).toBe(2);
    });

    it('utilise les sets/reps fournis', async () => {
      mockPrisma.program.findUnique.mockResolvedValue(FAKE_PROGRAM);
      mockPrisma.programExercise.count.mockResolvedValue(0);
      mockPrisma.programExercise.create.mockResolvedValue({ id: 'pe-1', sets: 5, reps: 8, order: 0 });

      await service.addExercise('user-1', 'prog-1', { exerciseId: 'ex-1', sets: 5, reps: 8 });

      const createArg = mockPrisma.programExercise.create.mock.calls[0][0];
      expect(createArg.data.sets).toBe(5);
      expect(createArg.data.reps).toBe(8);
    });

    it('lève ForbiddenException si le programme n\'appartient pas à l\'utilisateur', async () => {
      mockPrisma.program.findUnique.mockResolvedValue({ ...FAKE_PROGRAM, userId: 'other' });

      await expect(
        service.addExercise('user-1', 'prog-1', { exerciseId: 'ex-1' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── updateExercise ────────────────────────────────────────────────────────

  describe('updateExercise', () => {
    it('met à jour un exercice dans le programme', async () => {
      mockPrisma.program.findUnique.mockResolvedValue(FAKE_PROGRAM);
      mockPrisma.programExercise.update.mockResolvedValue({ sets: 4, reps: 12 });

      await service.updateExercise('user-1', 'prog-1', 'ex-1', { sets: 4, reps: 12 });

      expect(mockPrisma.programExercise.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { programId_exerciseId: { programId: 'prog-1', exerciseId: 'ex-1' } },
          data: { sets: 4, reps: 12 },
        }),
      );
    });

    it('lève ForbiddenException si le programme n\'appartient pas à l\'utilisateur', async () => {
      mockPrisma.program.findUnique.mockResolvedValue({ ...FAKE_PROGRAM, userId: 'other' });

      await expect(
        service.updateExercise('user-1', 'prog-1', 'ex-1', { sets: 4 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── removeExercise ────────────────────────────────────────────────────────

  describe('removeExercise', () => {
    it('retire un exercice du programme', async () => {
      mockPrisma.program.findUnique.mockResolvedValue(FAKE_PROGRAM);
      mockPrisma.programExercise.deleteMany.mockResolvedValue({ count: 1 });

      await service.removeExercise('user-1', 'prog-1', 'ex-1');

      expect(mockPrisma.programExercise.deleteMany).toHaveBeenCalledWith({
        where: { programId: 'prog-1', exerciseId: 'ex-1' },
      });
    });

    it('lève ForbiddenException si le programme n\'appartient pas à l\'utilisateur', async () => {
      mockPrisma.program.findUnique.mockResolvedValue({ ...FAKE_PROGRAM, userId: 'other' });

      await expect(
        service.removeExercise('user-1', 'prog-1', 'ex-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
