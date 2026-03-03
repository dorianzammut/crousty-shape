import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  getAll(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: { exercise: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggle(userId: string, exerciseId: string): Promise<{ favorited: boolean }> {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_exerciseId: { userId, exerciseId } },
    });
    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }
    await this.prisma.favorite.create({ data: { userId, exerciseId } });
    return { favorited: true };
  }
}
