import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const USER_SELECT = { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true };

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({ select: { ...USER_SELECT, _count: { select: { sessions: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  update(id: string, dto: any) {
    return this.prisma.user.update({ where: { id }, data: dto, select: USER_SELECT });
  }

  async getStats() {
    const [users, sessions, alerts] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.session.count(),
      this.prisma.alert.count(),
    ]);
    return { users, sessions, alerts };
  }
}
