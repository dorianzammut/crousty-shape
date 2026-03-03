import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.alert.findMany({
      include: { user: { select: { id: true, name: true, email: true } }, exercise: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByUser(userId: string) {
    return this.prisma.alert.findMany({
      where: { userId },
      include: { exercise: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
