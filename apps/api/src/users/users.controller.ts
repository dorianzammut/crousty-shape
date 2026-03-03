import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request, HttpCode, HttpStatus, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@Request() req: any) { return this.usersService.findOne(req.user.userId); }

  @Patch('me')
  updateMe(@Request() req: any, @Body() dto: { name?: string; email?: string }) {
    return this.usersService.updateMe(req.user.userId, dto);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  changePassword(@Request() req: any, @Body() dto: { currentPassword: string; newPassword: string }) {
    return this.usersService.changePassword(req.user.userId, dto);
  }

  @Get('stats')
  stats() { return this.usersService.getStats(); }

  @Get('growth')
  growth(@Query('range') range: string) { return this.usersService.getGrowth(range); }

  @Get()
  findAll() { return this.usersService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.usersService.findOne(id); }

  @Post()
  create(@Body() dto: { email: string; name: string; password: string; role: string }) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) { return this.usersService.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    if (req.user.userId === id) throw new ForbiddenException('Vous ne pouvez pas supprimer votre propre compte');
    return this.usersService.remove(id);
  }
}
