import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

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

  updateMe(userId: string, dto: { name?: string; email?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data: dto, select: USER_SELECT });
  }

  async changePassword(userId: string, dto: { currentPassword: string; newPassword: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new ForbiddenException('Current password is incorrect');
    const hash = await bcrypt.hash(dto.newPassword, 10);
    return this.prisma.user.update({ where: { id: userId }, data: { password: hash }, select: USER_SELECT });
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
