import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  getMyPrograms(userId: string) {
    return this.prisma.program.findMany({
      where: { userId },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, dto: { name: string; description?: string }) {
    return this.prisma.program.create({
      data: { userId, name: dto.name, description: dto.description },
      include: { exercises: { include: { exercise: true } } },
    });
  }

  async delete(userId: string, programId: string) {
    const program = await this.prisma.program.findUnique({ where: { id: programId } });
    if (!program || program.userId !== userId) throw new ForbiddenException();
    return this.prisma.program.delete({ where: { id: programId } });
  }

  async addExercise(userId: string, programId: string, dto: { exerciseId: string; sets?: number; reps?: number }) {
    const program = await this.prisma.program.findUnique({ where: { id: programId } });
    if (!program || program.userId !== userId) throw new ForbiddenException();
    const count = await this.prisma.programExercise.count({ where: { programId } });
    return this.prisma.programExercise.create({
      data: { programId, exerciseId: dto.exerciseId, sets: dto.sets ?? 3, reps: dto.reps ?? 10, order: count },
      include: { exercise: true },
    });
  }

  async updateExercise(userId: string, programId: string, exerciseId: string, dto: { sets?: number; reps?: number }) {
    const program = await this.prisma.program.findUnique({ where: { id: programId } });
    if (!program || program.userId !== userId) throw new ForbiddenException();
    return this.prisma.programExercise.update({
      where: { programId_exerciseId: { programId, exerciseId } },
      data: { sets: dto.sets, reps: dto.reps },
      include: { exercise: true },
    });
  }

  async removeExercise(userId: string, programId: string, exerciseId: string) {
    const program = await this.prisma.program.findUnique({ where: { id: programId } });
    if (!program || program.userId !== userId) throw new ForbiddenException();
    return this.prisma.programExercise.deleteMany({ where: { programId, exerciseId } });
  }
}
