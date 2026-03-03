import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';

@Injectable()
export class FirebaseService {
  private bucket: admin.storage.Storage;

  constructor(private config: ConfigService) {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey } as admin.ServiceAccount),
        storageBucket: `${projectId}.firebasestorage.app`,
      });
    }

    this.bucket = admin.storage();
  }

  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: 'images' | 'videos',
  ): Promise<string> {
    const ext = originalName.split('.').pop();
    const fileName = `uploads/${folder}/${randomUUID()}.${ext}`;
    const bucket = this.bucket.bucket();
    const file = bucket.file(fileName);

    await file.save(buffer, {
      metadata: { contentType: mimeType },
    });

    await file.makePublic();

    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  }
}
