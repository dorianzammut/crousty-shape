import { Injectable, signal } from '@angular/core';
import { FilesetResolver, PoseLandmarker, PoseLandmarkerResult } from '@mediapipe/tasks-vision';

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

@Injectable({ providedIn: 'root' })
export class PoseDetectionService {
  private landmarker: PoseLandmarker | null = null;

  readonly isReady = signal(false);
  readonly isLoading = signal(false);

  async initialize(): Promise<void> {
    if (this.isReady() || this.isLoading()) return;
    this.isLoading.set(true);
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
      this.landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      } as any);
      this.isReady.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  detectForVideo(video: HTMLVideoElement, timestamp: number): PoseLandmarkerResult | null {
    if (this.landmarker && this.isReady()) {
      return this.landmarker.detectForVideo(video, timestamp);
    }
    return null;
  }
}
