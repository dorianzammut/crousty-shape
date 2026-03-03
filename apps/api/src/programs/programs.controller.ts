import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('programs')
@UseGuards(JwtAuthGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  getMyPrograms(@Req() req: any) {
    return this.programsService.getMyPrograms(req.user.userId);
  }

  @Post()
  create(@Req() req: any, @Body() dto: { name: string; description?: string }) {
    return this.programsService.create(req.user.userId, dto);
  }

  @Delete(':id')
  delete(@Req() req: any, @Param('id') id: string) {
    return this.programsService.delete(req.user.userId, id);
  }

  @Post(':id/exercises')
  addExercise(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: { exerciseId: string; sets?: number; reps?: number },
  ) {
    return this.programsService.addExercise(req.user.userId, id, dto);
  }

  @Patch(':id/exercises/:exerciseId')
  updateExercise(
    @Req() req: any,
    @Param('id') id: string,
    @Param('exerciseId') exerciseId: string,
    @Body() dto: { sets?: number; reps?: number },
  ) {
    return this.programsService.updateExercise(req.user.userId, id, exerciseId, dto);
  }

  @Delete(':id/exercises/:exerciseId')
  removeExercise(
    @Req() req: any,
    @Param('id') id: string,
    @Param('exerciseId') exerciseId: string,
  ) {
    return this.programsService.removeExercise(req.user.userId, id, exerciseId);
  }
}
