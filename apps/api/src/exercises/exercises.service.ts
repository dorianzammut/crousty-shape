import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const EXERCISE_SELECT = {
  id: true, name: true, category: true, level: true,
  description: true, imageUrl: true, videoUrl: true,
  createdById: true,
  createdBy: { select: { id: true, name: true } },
};

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.exercise.findMany({ select: EXERCISE_SELECT, orderBy: { name: 'asc' } });
  }

  findByCreator(userId: string) {
    return this.prisma.exercise.findMany({
      where: { createdById: userId },
      select: EXERCISE_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async getCategories() {
    const groups = await this.prisma.exercise.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });
    return groups.map(g => ({ label: g.category, count: g._count.category }));
  }

  async findOne(id: string) {
    const ex = await this.prisma.exercise.findUnique({ where: { id }, select: EXERCISE_SELECT });
    if (!ex) throw new NotFoundException('Exercise not found');
    return ex;
  }

  create(dto: any, createdById?: string) {
    return this.prisma.exercise.create({
      data: { ...dto, createdById },
      select: EXERCISE_SELECT,
    });
  }

  update(id: string, dto: any) {
    return this.prisma.exercise.update({ where: { id }, data: dto, select: EXERCISE_SELECT });
  }

  async remove(id: string, userId?: string, userRole?: string) {
    const ex = await this.prisma.exercise.findUnique({ where: { id } });
    if (!ex) throw new NotFoundException('Exercise not found');

    // Coaches can only delete their own exercises
    if (userRole === 'COACH' && ex.createdById !== userId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres exercices');
    }

    await this.prisma.alert.deleteMany({ where: { exerciseId: id } });
    await this.prisma.session.deleteMany({ where: { exerciseId: id } });
    await this.prisma.exercise.delete({ where: { id } });
    return { deleted: true };
  }
}
