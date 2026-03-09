import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { ExercisesService } from './exercises.service';
import { PrismaService } from '../prisma/prisma.service';

const FAKE_EXERCISE = {
  id: 'ex-1',
  name: 'Squat',
  category: 'LEGS',
  level: 'BEGINNER',
  description: 'Leg exercise',
  imageUrl: null,
  videoUrl: null,
  status: 'READY',
  skeletonUrl: null,
  featuresUrl: null,
  repsUrl: null,
  templateUrl: null,
  createdById: 'user-1',
  createdBy: { id: 'user-1', name: 'Alice' },
};

const mockPrisma = {
  exercise: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    groupBy: jest.fn(),
  },
  alert: { deleteMany: jest.fn() },
  session: { deleteMany: jest.fn() },
};

const mockHttpService = {
  get: jest.fn(),
  post: jest.fn(),
};

describe('ExercisesService', () => {
  let service: ExercisesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExercisesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<ExercisesService>(ExercisesService);
    jest.clearAllMocks();
  });

  // ─── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('retourne tous les exercices', async () => {
      mockPrisma.exercise.findMany.mockResolvedValue([FAKE_EXERCISE]);

      const result = await service.findAll();

      expect(result).toEqual([FAKE_EXERCISE]);
      expect(mockPrisma.exercise.findMany).toHaveBeenCalled();
    });
  });

  // ─── findByCreator ─────────────────────────────────────────────────────────

  describe('findByCreator', () => {
    it('retourne les exercices d\'un créateur', async () => {
      mockPrisma.exercise.findMany.mockResolvedValue([FAKE_EXERCISE]);

      const result = await service.findByCreator('user-1');

      expect(result).toEqual([FAKE_EXERCISE]);
      expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { createdById: 'user-1' } }),
      );
    });
  });

  // ─── getCategories ─────────────────────────────────────────────────────────

  describe('getCategories', () => {
    it('retourne les catégories avec leur nombre d\'exercices', async () => {
      mockPrisma.exercise.groupBy.mockResolvedValue([
        { category: 'LEGS', _count: { category: 5 } },
        { category: 'ARMS', _count: { category: 3 } },
      ]);

      const result = await service.getCategories();

      expect(result).toEqual([
        { label: 'LEGS', count: 5 },
        { label: 'ARMS', count: 3 },
      ]);
    });
  });

  // ─── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('retourne l\'exercice trouvé', async () => {
      mockPrisma.exercise.findUnique.mockResolvedValue(FAKE_EXERCISE);

      const result = await service.findOne('ex-1');

      expect(result).toEqual(FAKE_EXERCISE);
    });

    it('lève NotFoundException si l\'exercice n\'existe pas', async () => {
      mockPrisma.exercise.findUnique.mockResolvedValue(null);

      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('crée un exercice sans videoUrl (status par défaut)', async () => {
      mockPrisma.exercise.create.mockResolvedValue(FAKE_EXERCISE);

      const result = await service.create({ name: 'Squat', category: 'LEGS' }, 'user-1');

      expect(result).toEqual(FAKE_EXERCISE);
      const createArg = mockPrisma.exercise.create.mock.calls[0][0];
      expect(createArg.data.status).toBeUndefined();
      expect(mockHttpService.post).not.toHaveBeenCalled();
    });

    it('passe en PROCESSING et déclenche le worker si videoUrl fourni', async () => {
      const exerciseWithVideo = { ...FAKE_EXERCISE, videoUrl: 'https://example.com/video.mp4', status: 'PROCESSING' };
      mockPrisma.exercise.create.mockResolvedValue(exerciseWithVideo);
      mockHttpService.post.mockReturnValue(of({ data: { ok: true } }));

      await service.create({ name: 'Squat', videoUrl: 'https://example.com/video.mp4' }, 'user-1');

      const createArg = mockPrisma.exercise.create.mock.calls[0][0];
      expect(createArg.data.status).toBe('PROCESSING');
    });
  });

  // ─── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('met à jour un exercice sans videoUrl', async () => {
      const updated = { ...FAKE_EXERCISE, name: 'Squat V2' };
      mockPrisma.exercise.update.mockResolvedValue(updated);

      const result = await service.update('ex-1', { name: 'Squat V2' });

      expect(result.name).toBe('Squat V2');
      const updateArg = mockPrisma.exercise.update.mock.calls[0][0];
      expect(updateArg.data.status).toBeUndefined();
    });

    it('remet à zéro les URLs et passe en PROCESSING si videoUrl fourni', async () => {
      const updated = { ...FAKE_EXERCISE, status: 'PROCESSING', skeletonUrl: null };
      mockPrisma.exercise.update.mockResolvedValue(updated);
      mockHttpService.post.mockReturnValue(of({ data: {} }));

      await service.update('ex-1', { videoUrl: 'https://example.com/new-video.mp4' });

      const updateArg = mockPrisma.exercise.update.mock.calls[0][0];
      expect(updateArg.data.status).toBe('PROCESSING');
      expect(updateArg.data.skeletonUrl).toBeNull();
      expect(updateArg.data.featuresUrl).toBeNull();
      expect(updateArg.data.repsUrl).toBeNull();
      expect(updateArg.data.templateUrl).toBeNull();
    });
  });

  // ─── completeProcessing ────────────────────────────────────────────────────

  describe('completeProcessing', () => {
    it('met à jour le statut et les URLs de l\'exercice', async () => {
      const updated = { ...FAKE_EXERCISE, status: 'DONE', skeletonUrl: 'https://example.com/skel.json' };
      mockPrisma.exercise.update.mockResolvedValue(updated);

      const result = await service.completeProcessing('ex-1', {
        status: 'DONE',
        skeletonUrl: 'https://example.com/skel.json',
      });

      expect(result.status).toBe('DONE');
      const updateArg = mockPrisma.exercise.update.mock.calls[0][0];
      expect(updateArg.data.status).toBe('DONE');
      expect(updateArg.data.skeletonUrl).toBe('https://example.com/skel.json');
    });

    it('n\'inclut que les champs fournis', async () => {
      mockPrisma.exercise.update.mockResolvedValue(FAKE_EXERCISE);

      await service.completeProcessing('ex-1', { status: 'FAILED', error: 'timeout' });

      const updateArg = mockPrisma.exercise.update.mock.calls[0][0];
      expect(updateArg.data.skeletonUrl).toBeUndefined();
      expect(updateArg.data.featuresUrl).toBeUndefined();
    });
  });

  // ─── getSkeletonData ───────────────────────────────────────────────────────

  describe('getSkeletonData', () => {
    it('retourne les données skeleton depuis l\'URL', async () => {
      mockPrisma.exercise.findUnique.mockResolvedValue({ skeletonUrl: 'https://example.com/skel.json' });
      mockHttpService.get.mockReturnValue(of({ data: { joints: [] } }));

      const result = await service.getSkeletonData('ex-1');

      expect(result).toEqual({ joints: [] });
      expect(mockHttpService.get).toHaveBeenCalledWith('https://example.com/skel.json');
    });

    it('lève NotFoundException si l\'exercice n\'existe pas', async () => {
      mockPrisma.exercise.findUnique.mockResolvedValue(null);

      await expect(service.getSkeletonData('unknown')).rejects.toThrow(NotFoundException);
    });

    it('lève NotFoundException si skeletonUrl est absent', async () => {
      mockPrisma.exercise.findUnique.mockResolvedValue({ skeletonUrl: null });

      await expect(service.getSkeletonData('ex-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getTemplateData ───────────────────────────────────────────────────────

  describe('getTemplateData', () => {
    it('retourne les données template depuis l\'URL', async () => {
      mockPrisma.exercise.findUnique.mockResolvedValue({ templateUrl: 'https://example.com/tpl.json' });
      mockHttpService.get.mockReturnValue(of({ data: { template: 'data' } }));

      const result = await service.getTemplateData('ex-1');

      expect(result).toEqual({ template: 'data' });
    });

    it('lève NotFoundException si l\'exercice n\'existe pas', async () => {
      mockPrisma.exercise.findUnique.mockResolvedValue(null);

      await expect(service.getTemplateData('unknown')).rejects.toThrow(NotFoundException);
    });

    it('lève NotFoundException si templateUrl est absent', async () => {
      mockPrisma.exercise.findUnique.mockResolvedValue({ templateUrl: null });

      await expect(service.getTemplateData('ex-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('supprime l\'exercice et ses données liées', async () => {
      mockPrisma.exercise.findUnique.mockResolvedValue(FAKE_EXERCISE);
      mockPrisma.alert.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.exercise.delete.mockResolvedValue(FAKE_EXERCISE);

      const result = await service.remove('ex-1', 'user-1', 'ADMIN');

      expect(result).toEqual({ deleted: true });
      expect(mockPrisma.alert.deleteMany).toHaveBeenCalledWith({ where: { exerciseId: 'ex-1' } });
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({ where: { exerciseId: 'ex-1' } });
      expect(mockPrisma.exercise.delete).toHaveBeenCalledWith({ where: { id: 'ex-1' } });
    });

    it('lève NotFoundException si l\'exercice n\'existe pas', async () => {
      mockPrisma.exercise.findUnique.mockResolvedValue(null);

      await expect(service.remove('unknown')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.exercise.delete).not.toHaveBeenCalled();
    });

    it('un COACH peut supprimer son propre exercice', async () => {
      mockPrisma.exercise.findUnique.mockResolvedValue({ ...FAKE_EXERCISE, createdById: 'user-1' });
      mockPrisma.alert.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.exercise.delete.mockResolvedValue(FAKE_EXERCISE);

      await expect(service.remove('ex-1', 'user-1', 'COACH')).resolves.toEqual({ deleted: true });
    });

    it('un COACH ne peut pas supprimer l\'exercice d\'un autre', async () => {
      mockPrisma.exercise.findUnique.mockResolvedValue({ ...FAKE_EXERCISE, createdById: 'other-user' });

      await expect(service.remove('ex-1', 'user-1', 'COACH')).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.exercise.delete).not.toHaveBeenCalled();
    });

    it('un USER peut supprimer n\'importe quel exercice (pas de vérification de rôle)', async () => {
      mockPrisma.exercise.findUnique.mockResolvedValue({ ...FAKE_EXERCISE, createdById: 'other-user' });
      mockPrisma.alert.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.exercise.delete.mockResolvedValue(FAKE_EXERCISE);

      await expect(service.remove('ex-1', 'user-1', 'USER')).resolves.toEqual({ deleted: true });
    });
  });
});
