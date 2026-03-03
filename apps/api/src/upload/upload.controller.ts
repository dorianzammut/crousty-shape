import {
  Controller, Post, Query, UseGuards, UseInterceptors,
  UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FirebaseService } from '../firebase/firebase.service';

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;  // 100 MB

@Controller('upload')
export class UploadController {
  constructor(private readonly firebase: FirebaseService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('type') type: 'image' | 'video',
  ) {
    if (!file) throw new BadRequestException('Aucun fichier envoyé');
    if (!type || !['image', 'video'].includes(type)) {
      throw new BadRequestException('Le paramètre type doit être "image" ou "video"');
    }

    const allowedMimes = type === 'image' ? IMAGE_MIMES : VIDEO_MIMES;
    const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(`Type MIME non autorisé: ${file.mimetype}`);
    }
    if (file.size > maxSize) {
      throw new BadRequestException(`Fichier trop volumineux (max ${maxSize / 1024 / 1024} MB)`);
    }

    const folder = type === 'image' ? 'images' : 'videos';
    const url = await this.firebase.uploadFile(file.buffer, file.originalname, file.mimetype, folder);

    return { url };
  }
}
