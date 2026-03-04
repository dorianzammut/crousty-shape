import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';

@Module({
  imports: [HttpModule],
  controllers: [ExercisesController],
  providers: [ExercisesService],
})
export class ExercisesModule {}
