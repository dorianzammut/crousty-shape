import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  getAll(@Request() req: any) {
    return this.favoritesService.getAll(req.user.userId);
  }

  @Post(':exerciseId')
  toggle(@Param('exerciseId') exerciseId: string, @Request() req: any) {
    return this.favoritesService.toggle(req.user.userId, exerciseId);
  }
}
