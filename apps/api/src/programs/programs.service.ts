import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() { return this.prisma.program.findMany({ orderBy: { createdAt: 'desc' } }); }
  create(dto: any) { return this.prisma.program.create({ data: dto }); }
}
