import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

const EXERCISE_SELECT = {
  id: true, name: true, category: true, level: true,
  description: true, imageUrl: true, videoUrl: true,
  status: true, skeletonUrl: true, featuresUrl: true, repsUrl: true, templateUrl: true,
  createdById: true,
  createdBy: { select: { id: true, name: true } },
};

@Injectable()
export class ExercisesService {
  private readonly logger = new Logger(ExercisesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

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

  async create(dto: any, createdById?: string) {
    const data: any = { ...dto, createdById };
    if (dto.videoUrl) {
      data.status = 'PROCESSING';
    }

    const exercise = await this.prisma.exercise.create({
      data,
      select: EXERCISE_SELECT,
    });

    if (dto.videoUrl) {
      this.triggerProcessing(exercise.id, dto.videoUrl);
    }

    return exercise;
  }

  async update(id: string, dto: any) {
    const data: any = { ...dto };
    if (dto.videoUrl) {
      data.status = 'PROCESSING';
      data.skeletonUrl = null;
      data.featuresUrl = null;
      data.repsUrl = null;
      data.templateUrl = null;
    }

    const exercise = await this.prisma.exercise.update({
      where: { id },
      data,
      select: EXERCISE_SELECT,
    });

    if (dto.videoUrl) {
      this.triggerProcessing(exercise.id, dto.videoUrl);
    }

    return exercise;
  }

  async completeProcessing(id: string, dto: { status: string; skeletonUrl?: string; featuresUrl?: string; repsUrl?: string; templateUrl?: string; error?: string }) {
    const data: any = { status: dto.status };
    if (dto.skeletonUrl) data.skeletonUrl = dto.skeletonUrl;
    if (dto.featuresUrl) data.featuresUrl = dto.featuresUrl;
    if (dto.repsUrl) data.repsUrl = dto.repsUrl;
    if (dto.templateUrl) data.templateUrl = dto.templateUrl;

    return this.prisma.exercise.update({
      where: { id },
      data,
      select: EXERCISE_SELECT,
    });
  }

  async getSkeletonData(id: string) {
    const ex = await this.prisma.exercise.findUnique({ where: { id }, select: { skeletonUrl: true } });
    if (!ex) throw new NotFoundException('Exercise not found');
    if (!ex.skeletonUrl) throw new NotFoundException('No skeleton data available');

    const { data } = await firstValueFrom(this.httpService.get(ex.skeletonUrl));
    return data;
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

  private triggerProcessing(exerciseId: string, videoUrl: string) {
    const workerUrl = process.env.WORKER_URL || 'http://worker:8000';
    const apiCallbackUrl = process.env.API_CALLBACK_URL || 'http://api:3000';

    firstValueFrom(
      this.httpService.post(`${workerUrl}/process`, {
        exerciseId,
        videoUrl,
        callbackUrl: `${apiCallbackUrl}/exercises/${exerciseId}/processing-complete`,
      }),
    ).catch(err => {
      this.logger.error(`Failed to trigger processing for exercise ${exerciseId}: ${err.message}`);
      this.prisma.exercise.update({
        where: { id: exerciseId },
        data: { status: 'FAILED' },
      }).catch(() => {});
    });
  }
}
