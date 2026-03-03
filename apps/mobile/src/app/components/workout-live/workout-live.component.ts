import { Component, OnInit, OnDestroy, ElementRef, ViewChild, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { DrawingUtils, PoseLandmarker, PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { NavigationService } from '../../services/navigation.service';
import { SessionsService } from '../../services/sessions.service';
import { PoseDetectionService } from '../../services/pose-detection.service';

type WorkoutStatus = 'intro' | 'waiting' | 'ready' | 'active' | 'resting' | 'finished' | 'saving' | 'saved';
type RepQuality = 'perfect' | 'good' | 'bad' | null;

const DEMO_VIDEOS: Record<string, string> = {
  'Jambes':    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'Pectoraux': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'Dos':       'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'Épaules':   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'Bras':      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
};
const DEFAULT_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4';

@Component({
  selector: 'app-workout-live',
  imports: [LucideAngularModule],
  templateUrl: './workout-live.component.html'
})
export class WorkoutLiveComponent implements OnInit, OnDestroy {
  @ViewChild('skeletonCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cameraVideo', { static: false }) cameraVideoRef!: ElementRef<HTMLVideoElement>;

  private router = inject(Router);
  private sessionsService = inject(SessionsService);
  private poseService = inject(PoseDetectionService);
  navService = inject(NavigationService);

  // ── Workout state ──────────────────────────────────────────────────────────
  status = signal<WorkoutStatus>('intro');
  repCount = signal(0);
  setRepCount = signal(0);
  currentSet = signal(1);
  targetSets = signal(3);
  targetReps = signal(10);
  quality = signal(100);
  feedback = signal('Positionne-toi face à la caméra');
  lastRepQuality = signal<RepQuality>(null);
  elapsedSeconds = signal(0);
  restElapsed = signal(0);
  saveError = signal(false);
  cameraAvailable = signal(true);

  private repInterval: any;
  private timerInterval: any;
  private restTimer: any;
  private animFrameId: number = 0;
  private poseDetectionActive = false;
  private cameraStream: MediaStream | null = null;

  get exercise(): any { return this.navService.selectedExercise(); }

  get coachVideoUrl(): string {
    return DEMO_VIDEOS[this.exercise?.category] ?? DEFAULT_VIDEO;
  }

  get formattedDuration(): string {
    const s = this.elapsedSeconds();
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }

  get restFormattedDuration(): string {
    const s = this.restElapsed();
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }

  get poseReady(): boolean { return this.poseService.isReady(); }
  get poseLoading(): boolean { return this.poseService.isLoading(); }

  ngOnInit(): void {
    // Pre-load the model during intro so it's ready when the user starts
    this.poseService.initialize().catch(err => console.warn('MediaPipe init failed:', err));
  }

  ngOnDestroy(): void {
    clearInterval(this.repInterval);
    clearInterval(this.timerInterval);
    clearInterval(this.restTimer);
    this.poseDetectionActive = false;
    cancelAnimationFrame(this.animFrameId);
    this.stopCamera();
  }

  // ── Intro ─────────────────────────────────────────────────────────────────

  skipIntro(): void {
    const step = this.navService.programRunStep();
    this.targetSets.set(step?.sets ?? 3);
    this.targetReps.set(step?.reps ?? 10);
    this.currentSet.set(1);
    this.setRepCount.set(0);
    this.status.set('waiting');
    this.initCamera();
    setTimeout(() => this.startPoseDetectionLoop(), 150);
  }

  // ── Camera ────────────────────────────────────────────────────────────────

  private async initCamera(): Promise<void> {
    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      setTimeout(() => {
        const video = this.cameraVideoRef?.nativeElement;
        if (video && this.cameraStream) {
          video.srcObject = this.cameraStream;
          video.play().catch(() => {});
        }
      }, 150);
    } catch {
      this.cameraAvailable.set(false);
    }
  }

  private stopCamera(): void {
    this.cameraStream?.getTracks().forEach(t => t.stop());
    this.cameraStream = null;
  }

  // ── MediaPipe pose detection ───────────────────────────────────────────────

  private startPoseDetectionLoop(): void {
    this.poseDetectionActive = true;
    const loop = () => {
      if (!this.poseDetectionActive) return;
      const video = this.cameraVideoRef?.nativeElement;
      if (video && video.readyState >= 2) {
        const canvas = this.canvasRef?.nativeElement;
        if (canvas) {
          if (video.videoWidth > 0 && canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          const result = this.poseService.detectForVideo(video, performance.now());
          if (result) this.drawPoseResult(result);
        }
      }
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private drawPoseResult(result: PoseLandmarkerResult): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!result.landmarks.length) return;

    const color = this.status() === 'active'
      ? (this.lastRepQuality() === 'bad' ? '#ef4444' : '#facc15')
      : '#71717a';

    const drawingUtils = new DrawingUtils(ctx);
    for (const landmarks of result.landmarks) {
      drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
        color,
        lineWidth: 3,
      });
      drawingUtils.drawLandmarks(landmarks, {
        radius: 5,
        color,
        fillColor: color + '40',
      });
    }
  }

  // ── Workout flow ──────────────────────────────────────────────────────────

  startAnalysis(): void {
    this.status.set('ready');
    setTimeout(() => {
      this.status.set('active');
      this.startTimer();
      this.startRepSimulation();
    }, 2000);
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => this.elapsedSeconds.update(n => n + 1), 1000);
  }

  private startRepSimulation(): void {
    this.repInterval = setInterval(() => {
      this.setRepCount.update(n => n + 1);
      this.repCount.update(n => n + 1);

      const rand = Math.random();
      const q: RepQuality = rand > 0.8 ? 'bad' : (rand > 0.4 ? 'perfect' : 'good');
      this.lastRepQuality.set(q);

      if (q === 'bad') {
        this.feedback.set('Attention à ton dos !');
        this.quality.update(v => Math.max(0, v - 5));
      } else {
        this.feedback.set('Mouvement parfait, continue !');
        this.quality.update(v => Math.min(100, v + 2));
      }
      setTimeout(() => this.lastRepQuality.set(null), 1000);

      if (this.setRepCount() >= this.targetReps()) {
        clearInterval(this.repInterval);
        if (this.currentSet() >= this.targetSets()) {
          clearInterval(this.timerInterval);
          this.stopCamera();
          this.poseDetectionActive = false;
          cancelAnimationFrame(this.animFrameId);
          this.status.set('finished');
        } else {
          this.status.set('resting');
          this.startRestTimer();
        }
      }
    }, 3000);
  }

  private startRestTimer(): void {
    clearInterval(this.restTimer);
    this.restElapsed.set(0);
    this.restTimer = setInterval(() => this.restElapsed.update(n => n + 1), 1000);
  }

  startNextSet(): void {
    clearInterval(this.restTimer);
    this.currentSet.update(n => n + 1);
    this.setRepCount.set(0);
    this.lastRepQuality.set(null);
    this.status.set('ready');
    setTimeout(() => {
      this.status.set('active');
      this.startRepSimulation();
    }, 2000);
  }

  finishWorkout(): void {
    clearInterval(this.repInterval);
    clearInterval(this.timerInterval);
    clearInterval(this.restTimer);
    this.stopCamera();
    this.poseDetectionActive = false;
    cancelAnimationFrame(this.animFrameId);
    this.status.set('finished');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getRepQualityClass(): string {
    const q = this.lastRepQuality();
    if (q === 'perfect') return 'bg-yellow-400 text-black';
    if (q === 'good') return 'bg-green-500 text-white';
    return 'bg-red-500 text-white';
  }

  getRepQualityLabel(): string {
    const q = this.lastRepQuality();
    if (q === 'perfect') return 'Incroyable !';
    if (q === 'good') return 'Bien !';
    return 'Attention !';
  }

  // ── Save / navigate ───────────────────────────────────────────────────────

  saveSession(): void {
    const ex = this.exercise;
    if (!ex?.id) { this.navigateAfterSave(); return; }

    this.status.set('saving');
    this.saveError.set(false);

    this.sessionsService.create({
      exerciseId: ex.id,
      reps: this.repCount(),
      qualityScore: this.quality(),
      duration: this.elapsedSeconds(),
    }).subscribe({
      next: () => {
        this.status.set('saved');
        setTimeout(() => {
          const hasNext = this.navService.nextProgramExercise();
          if (hasNext) {
            this.resetForNextExercise();
          } else {
            this.navigateAfterSave();
          }
        }, 1200);
      },
      error: () => {
        this.status.set('finished');
        this.saveError.set(true);
      },
    });
  }

  private resetForNextExercise(): void {
    clearInterval(this.repInterval);
    clearInterval(this.timerInterval);
    clearInterval(this.restTimer);
    this.poseDetectionActive = false;
    cancelAnimationFrame(this.animFrameId);
    this.stopCamera();
    this.repCount.set(0);
    this.setRepCount.set(0);
    this.currentSet.set(1);
    this.quality.set(100);
    this.elapsedSeconds.set(0);
    this.restElapsed.set(0);
    this.feedback.set('Positionne-toi face à la caméra');
    this.lastRepQuality.set(null);
    this.saveError.set(false);
    this.cameraAvailable.set(true);
    this.status.set('intro');
  }

  private navigateAfterSave(): void {
    const wasProgramRun = this.navService.isProgramRunActive();
    this.navService.endProgramRun();
    this.router.navigate([wasProgramRun ? '/programs' : '/']);
  }

  restartWorkout(): void {
    clearInterval(this.repInterval);
    clearInterval(this.timerInterval);
    clearInterval(this.restTimer);
    this.poseDetectionActive = false;
    cancelAnimationFrame(this.animFrameId);
    const step = this.navService.programRunStep();
    this.targetSets.set(step?.sets ?? 3);
    this.targetReps.set(step?.reps ?? 10);
    this.repCount.set(0);
    this.setRepCount.set(0);
    this.currentSet.set(1);
    this.quality.set(100);
    this.elapsedSeconds.set(0);
    this.restElapsed.set(0);
    this.feedback.set('Positionne-toi face à la caméra');
    this.lastRepQuality.set(null);
    this.saveError.set(false);
    this.initCamera();
    setTimeout(() => this.startPoseDetectionLoop(), 150);
    this.status.set('waiting');
  }

  close(): void {
    this.stopCamera();
    this.poseDetectionActive = false;
    cancelAnimationFrame(this.animFrameId);
    const wasProgramRun = this.navService.isProgramRunActive();
    this.navService.endProgramRun();
    this.router.navigate([wasProgramRun ? '/programs' : '/']);
  }
}
