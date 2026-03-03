import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.session.findMany({
      include: { user: { select: { id: true, name: true, email: true } }, exercise: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByUser(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
      include: { exercise: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWeeklyStats(userId: string) {
    const weekAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    const sessions = await this.prisma.session.findMany({
      where: { userId, createdAt: { gte: weekAgo } },
      select: { createdAt: true, qualityScore: true },
      orderBy: { createdAt: 'asc' },
    });

    const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const data = Array(7).fill(0);
    sessions.forEach(s => {
      // getDay() : 0=Sun, 1=Mon ... → Mon=0 in our array
      const idx = (new Date(s.createdAt).getDay() + 6) % 7;
      data[idx] += Math.round(s.qualityScore);
    });
    return { labels, data };
  }

  create(dto: any) { return this.prisma.session.create({ data: dto }); }
}
