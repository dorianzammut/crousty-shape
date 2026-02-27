import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() { return this.prisma.session.findMany({ include: { user: true, exercise: true }, orderBy: { createdAt: 'desc' } }); }
  findByUser(userId: string) { return this.prisma.session.findMany({ where: { userId }, include: { exercise: true }, orderBy: { createdAt: 'desc' } }); }
  create(dto: any) { return this.prisma.session.create({ data: dto }); }
}
