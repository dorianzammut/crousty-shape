import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  findAll() { return this.sessionsService.findAll(); }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) { return this.sessionsService.findByUser(userId); }

  @Post()
  create(@Body() dto: any, @Request() req: any) {
    return this.sessionsService.create({ ...dto, userId: req.user.userId });
  }
}
