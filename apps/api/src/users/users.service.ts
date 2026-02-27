import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() { return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } }); }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  update(id: string, dto: any) {
    return this.prisma.user.update({ where: { id }, data: dto });
  }
}
