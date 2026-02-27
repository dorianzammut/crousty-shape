import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: { email: string; name: string; password: string }) {
    // TODO: hash password with bcrypt
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name },
    });
    return this.signToken(user.id, user.email);
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    // TODO: verify password hash
    return this.signToken(user.id, user.email);
  }

  private signToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    return { access_token: this.jwt.sign(payload) };
  }
}
