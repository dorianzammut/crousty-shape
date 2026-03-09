import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesService } from './favorites.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  favorite: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    jest.clearAllMocks();
  });

  // ─── getAll ────────────────────────────────────────────────────────────────

  describe('getAll', () => {
    it('retourne les favoris d\'un utilisateur', async () => {
      const favorites = [{ id: 'fav-1', userId: 'user-1', exerciseId: 'ex-1', exercise: {} }];
      mockPrisma.favorite.findMany.mockResolvedValue(favorites);

      const result = await service.getAll('user-1');

      expect(result).toEqual(favorites);
      expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });

    it('retourne un tableau vide si pas de favoris', async () => {
      mockPrisma.favorite.findMany.mockResolvedValue([]);

      const result = await service.getAll('user-no-fav');

      expect(result).toEqual([]);
    });
  });

  // ─── toggle ────────────────────────────────────────────────────────────────

  describe('toggle', () => {
    it('ajoute aux favoris si l\'exercice n\'est pas encore favori', async () => {
      mockPrisma.favorite.findUnique.mockResolvedValue(null);
      mockPrisma.favorite.create.mockResolvedValue({ id: 'fav-1', userId: 'user-1', exerciseId: 'ex-1' });

      const result = await service.toggle('user-1', 'ex-1');

      expect(result).toEqual({ favorited: true });
      expect(mockPrisma.favorite.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', exerciseId: 'ex-1' },
      });
      expect(mockPrisma.favorite.delete).not.toHaveBeenCalled();
    });

    it('retire des favoris si l\'exercice est déjà favori', async () => {
      const existing = { id: 'fav-1', userId: 'user-1', exerciseId: 'ex-1' };
      mockPrisma.favorite.findUnique.mockResolvedValue(existing);
      mockPrisma.favorite.delete.mockResolvedValue(existing);

      const result = await service.toggle('user-1', 'ex-1');

      expect(result).toEqual({ favorited: false });
      expect(mockPrisma.favorite.delete).toHaveBeenCalledWith({ where: { id: 'fav-1' } });
      expect(mockPrisma.favorite.create).not.toHaveBeenCalled();
    });

    it('recherche le favori avec la clé composite correcte', async () => {
      mockPrisma.favorite.findUnique.mockResolvedValue(null);
      mockPrisma.favorite.create.mockResolvedValue({});

      await service.toggle('user-1', 'ex-1');

      expect(mockPrisma.favorite.findUnique).toHaveBeenCalledWith({
        where: { userId_exerciseId: { userId: 'user-1', exerciseId: 'ex-1' } },
      });
    });
  });
});
