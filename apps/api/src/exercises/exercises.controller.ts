import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  findAll() { return this.exercisesService.findAll(); }

  @Get('categories')
  categories() { return this.exercisesService.getCategories(); }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@Request() req: any) {
    return this.exercisesService.findByCreator(req.user.userId);
  }

  @Get(':id/skeleton')
  getSkeleton(@Param('id') id: string) { return this.exercisesService.getSkeletonData(id); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.exercisesService.findOne(id); }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: any, @Request() req: any) {
    return this.exercisesService.create(dto, req.user.userId);
  }

  @Post(':id/processing-complete')
  processingComplete(
    @Param('id') id: string,
    @Body() dto: { status: string; skeletonUrl?: string; featuresUrl?: string; repsUrl?: string; templateUrl?: string; error?: string },
  ) {
    return this.exercisesService.completeProcessing(id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: any) { return this.exercisesService.update(id, dto); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.exercisesService.remove(id, req.user.userId, req.user.role);
  }
}
