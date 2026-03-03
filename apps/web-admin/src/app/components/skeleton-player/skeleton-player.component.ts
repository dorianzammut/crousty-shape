import {
  Component,
  Input,
  signal,
  inject,
  ElementRef,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ExercisesService } from '../../services/exercises.service';

interface SkeletonFrame {
  timestamp: number;
  landmarks: { x: number; y: number; z: number; visibility: number }[] | null;
}

const POSE_CONNECTIONS: [number, number][] = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left arm
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  // Right arm
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  // Left leg
  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
  // Right leg
  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
];

@Component({
  selector: 'app-skeleton-player',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="relative">
      <video
        #videoEl
        [src]="videoUrl"
        controls
        class="w-full rounded-lg"
      ></video>
      <canvas
        #canvasEl
        class="absolute inset-0 z-10 w-full h-full pointer-events-none rounded-lg"
      ></canvas>
    </div>
    @if (exerciseId && hasSkeletonUrl) {
      <div
        (click)="toggleSkeleton()"
        class="flex items-center justify-end gap-2 mt-2 cursor-pointer select-none"
      >
        @if (loadingFrames()) {
          <span class="text-xs text-zinc-500 animate-pulse">Chargement...</span>
        }
        <span class="text-sm text-zinc-400">Squelette</span>
        <div
          class="relative w-10 h-5 rounded-full transition-colors"
          [class.bg-yellow-400]="showSkeleton()"
          [class.bg-zinc-600]="!showSkeleton()"
        >
          <div
            class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
            [class.translate-x-5]="showSkeleton()"
          ></div>
        </div>
      </div>
    }
  `,
})
export class SkeletonPlayerComponent implements OnDestroy {
  @Input({ required: true }) videoUrl!: string;
  @Input() exerciseId: string | null = null;
  @Input() hasSkeletonUrl = false;

  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasRef!: ElementRef<HTMLCanvasElement>;

  private exercisesService = inject(ExercisesService);

  showSkeleton = signal(false);
  loadingFrames = signal(false);
  private frames = signal<SkeletonFrame[]>([]);
  private animFrameId: number | null = null;

  async toggleSkeleton() {
    if (this.showSkeleton()) {
      this.showSkeleton.set(false);
      this.stopLoop();
      this.clearCanvas();
      return;
    }

    if (this.frames().length === 0 && this.exerciseId) {
      this.loadingFrames.set(true);
      try {
        const raw = await firstValueFrom(
          this.exercisesService.getSkeleton(this.exerciseId)
        );
        const data: SkeletonFrame[] = (raw.frames ?? raw)
          .filter((f: SkeletonFrame) => f.landmarks !== null);
        this.frames.set(data);
      } catch {
        this.loadingFrames.set(false);
        return;
      }
      this.loadingFrames.set(false);
    }

    this.showSkeleton.set(true);
    this.startLoop();
  }

  ngOnDestroy() {
    this.stopLoop();
  }

  private startLoop() {
    const tick = () => {
      if (!this.showSkeleton()) return;
      this.drawFrame();
      this.animFrameId = requestAnimationFrame(tick);
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  private stopLoop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private clearCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  private drawFrame() {
    const video = this.videoRef?.nativeElement;
    const canvas = this.canvasRef?.nativeElement;
    if (!video || !canvas) return;

    const allFrames = this.frames();
    if (allFrames.length === 0) return;

    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentTime = video.currentTime;
    const frame = this.findClosestFrame(allFrames, currentTime);
    if (!frame || !frame.landmarks) return;

    const w = canvas.width;
    const h = canvas.height;
    const landmarks = frame.landmarks;

    // Draw connections
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    for (const [i, j] of POSE_CONNECTIONS) {
      const a = landmarks[i];
      const b = landmarks[j];
      if (!a || !b) continue;
      if (a.visibility <= 0.5 || b.visibility <= 0.5) continue;
      ctx.beginPath();
      ctx.moveTo(a.x * w, a.y * h);
      ctx.lineTo(b.x * w, b.y * h);
      ctx.stroke();
    }

    // Draw landmarks
    ctx.fillStyle = '#FBBF24';
    for (const lm of landmarks) {
      if (lm.visibility <= 0.5) continue;
      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private findClosestFrame(
    frames: SkeletonFrame[],
    time: number
  ): SkeletonFrame | null {
    if (frames.length === 0) return null;

    let lo = 0;
    let hi = frames.length - 1;

    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (frames[mid].timestamp < time) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    if (lo === 0) return frames[0];
    const prev = frames[lo - 1];
    const curr = frames[lo];
    return Math.abs(prev.timestamp - time) <= Math.abs(curr.timestamp - time)
      ? prev
      : curr;
  }
}
