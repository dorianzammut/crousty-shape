import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

const USER_SELECT = { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true };

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: { email: string; name: string; password: string; role: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const hash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: { email: dto.email, name: dto.name, password: hash, role: dto.role as Role },
      select: { ...USER_SELECT, _count: { select: { sessions: true } } },
    });
  }

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
  
  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.session.deleteMany({ where: { userId: id } });
    await this.prisma.alert.deleteMany({ where: { userId: id } });
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }

  async getStats() {
    const [users, sessions, alerts] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.session.count(),
      this.prisma.alert.count(),
    ]);
    return { users, sessions, alerts };
  }

  async getGrowth(range: string = 'month'): Promise<{ labels: string[]; data: number[] }> {
    const now = new Date();
    const users = await this.prisma.user.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    interface Bucket { label: string; end: Date }
    const buckets: Bucket[] = [];

    switch (range) {
      case 'week': {
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          d.setHours(23, 59, 59, 999);
          buckets.push({
            label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
            end: d,
          });
        }
        break;
      }
      case 'month': {
        for (let i = 4; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i * 7);
          d.setHours(23, 59, 59, 999);
          buckets.push({
            label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
            end: d,
          });
        }
        break;
      }
      case 'year': {
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
          buckets.push({
            label: d.toLocaleDateString('fr-FR', { month: 'short' }),
            end: d,
          });
        }
        break;
      }
      case '5years': {
        for (let i = 4; i >= 0; i--) {
          const d = new Date(now.getFullYear() - i, 11, 31, 23, 59, 59, 999);
          buckets.push({ label: d.getFullYear().toString(), end: d });
        }
        break;
      }
      default:
        return this.getGrowth('month');
    }

    const labels = buckets.map(b => b.label);
    const data = buckets.map(b => users.filter(u => u.createdAt <= b.end).length);

    return { labels, data };
  }
}
