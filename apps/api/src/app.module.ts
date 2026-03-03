import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ExercisesModule } from './exercises/exercises.module';
import { SessionsModule } from './sessions/sessions.module';
import { ProgramsModule } from './programs/programs.module';
import { AlertsModule } from './alerts/alerts.module';
import { FavoritesModule } from './favorites/favorites.module';
import { FirebaseModule } from './firebase/firebase.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    FirebaseModule,
    AuthModule,
    UsersModule,
    ExercisesModule,
    SessionsModule,
    ProgramsModule,
    AlertsModule,
    FavoritesModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
