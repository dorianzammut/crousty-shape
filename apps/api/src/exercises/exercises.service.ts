import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() { return this.prisma.exercise.findMany(); }

  async findOne(id: string) {
    const ex = await this.prisma.exercise.findUnique({ where: { id } });
    if (!ex) throw new NotFoundException('Exercise not found');
    return ex;
  }

  create(dto: any) { return this.prisma.exercise.create({ data: dto }); }
  update(id: string, dto: any) { return this.prisma.exercise.update({ where: { id }, data: dto }); }
  remove(id: string) { return this.prisma.exercise.delete({ where: { id } }); }
}
