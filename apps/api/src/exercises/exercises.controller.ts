import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  findAll() { return this.exercisesService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.exercisesService.findOne(id); }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: any) { return this.exercisesService.create(dto); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: any) { return this.exercisesService.update(id, dto); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) { return this.exercisesService.remove(id); }
}
