import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  findAll() { return this.programsService.findAll(); }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: any) { return this.programsService.create(dto); }
}
