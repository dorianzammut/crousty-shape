import { Component, OnInit, OnDestroy, ElementRef, ViewChild, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { DrawingUtils, PoseLandmarker, PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { NavigationService } from '../../services/navigation.service';
import { SessionsService } from '../../services/sessions.service';
import { PoseDetectionService } from '../../services/pose-detection.service';
import { TemplateService } from '../../services/template.service';
import { computeAngles, ANGLE_LANDMARKS } from '../../utils/angle-computation';
import { createRepDetector, processFrame, scoreToQuality, ExerciseTemplate, RepDetectorState } from '../../utils/rep-detection';

type WorkoutStatus = 'intro' | 'waiting' | 'ready' | 'active' | 'resting' | 'finished' | 'saving' | 'saved';
type RepQuality = 'perfect' | 'good' | 'bad' | null;

// Skeleton segment colors
const COLOR_GOOD = '#22c55e';
const COLOR_CLOSE = '#f97316';
const COLOR_BAD = '#ef4444';
const COLOR_NEUTRAL = '#71717a';

// MediaPipe POSE_CONNECTIONS as pairs of landmark indices
const POSE_CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,7],[0,4],[4,5],[5,6],[6,8],
  [9,10],[11,12],[11,13],[13,15],[15,17],[15,19],[15,21],
  [12,14],[14,16],[16,18],[16,20],[16,22],
  [11,23],[12,24],[23,24],[23,25],[24,26],[25,27],[26,28],
  [27,29],[28,30],[29,31],[30,32],
];

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
  private templateService = inject(TemplateService);
  navService = inject(NavigationService);

  // ── Workout state ──────────────────────────────────────────────────────────
  status = signal<WorkoutStatus>('intro');
  repCount = signal(0);
  setRepCount = signal(0);
  currentSet = signal(1);
  targetSets = signal(3);
  targetReps = signal(10);
  quality = signal(0);
  feedback = signal('Positionne-toi face à la caméra');
  lastRepQuality = signal<RepQuality>(null);
  elapsedSeconds = signal(0);
  restElapsed = signal(0);
  saveError = signal(false);
  cameraAvailable = signal(true);

  // ── Template / scoring state ───────────────────────────────────────────────
  templateLoaded = signal(false);
  templateError = signal(false);
  angleConformity = signal<Record<string, 'good' | 'close' | 'bad'>>({});
  private template: ExerciseTemplate | null = null;
  private repDetector: RepDetectorState | null = null;
  private qualitySum = 0;

  private timerInterval: any;
  private restTimer: any;
  private animFrameId: number = 0;
  private poseDetectionActive = false;
  private cameraStream: MediaStream | null = null;

  get exercise(): any { return this.navService.selectedExercise(); }

  get coachVideoUrl(): string | null {
    return this.exercise?.videoUrl ?? null;
  }

  get formattedDuration(): string {
    const s = this.elapsedSeconds();
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }

  get restFormattedDuration(): string {
    const s = this.restElapsed();
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }

  get avgQuality(): number {
    return this.repCount() > 0 ? Math.round(this.qualitySum / this.repCount()) : 0;
  }

  get poseReady(): boolean { return this.poseService.isReady(); }
  get poseLoading(): boolean { return this.poseService.isLoading(); }

  ngOnInit(): void {
    if (!this.exercise) {
      this.router.navigate(['/exercises']);
      return;
    }
    this.poseService.initialize().catch(err => console.warn('MediaPipe init failed:', err));
  }

  ngOnDestroy(): void {
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

    // Fetch template via API proxy
    const exerciseId = this.exercise?.id;
    if (exerciseId) {
      this.templateLoaded.set(false);
      this.templateError.set(false);
      this.templateService.getTemplate(exerciseId).subscribe(tpl => {
        if (tpl) {
          this.template = tpl;
          this.repDetector = createRepDetector(tpl);
          this.templateLoaded.set(true);
        } else {
          this.templateError.set(true);
        }
      });
    } else {
      this.templateError.set(true);
    }
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

    const landmarks = result.landmarks[0];

    // Real scoring when active + template loaded
    if (this.status() === 'active' && this.template && this.repDetector) {
      const angles = computeAngles(landmarks);
      if (angles) {
        const frameResult = processFrame(this.repDetector, angles, this.template);
        this.angleConformity.set(frameResult.angleConformity);

        if (frameResult.repCompleted) {
          this.handleRepCompleted(frameResult.repScore);
        }

        this.drawColoredSkeleton(ctx, landmarks, frameResult.angleConformity);
        return;
      }
    }

    // Fallback: monochrome skeleton (waiting / ready / angles not computed)
    const color = this.status() === 'active'
      ? (this.lastRepQuality() === 'bad' ? '#ef4444' : '#facc15')
      : COLOR_NEUTRAL;

    const drawingUtils = new DrawingUtils(ctx);
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

  // ── Colored skeleton drawing ──────────────────────────────────────────────

  private drawColoredSkeleton(
    ctx: CanvasRenderingContext2D,
    landmarks: { x: number; y: number; z: number; visibility?: number }[],
    conformity: Record<string, 'good' | 'close' | 'bad'>,
  ): void {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Build per-landmark status (worst of any angle using that landmark)
    const landmarkStatus = new Map<number, 'good' | 'close' | 'bad'>();
    const priority: Record<string, number> = { bad: 2, close: 1, good: 0 };

    for (const [angleName, status] of Object.entries(conformity)) {
      const indices = ANGLE_LANDMARKS[angleName];
      if (!indices) continue;
      for (const idx of indices) {
        const current = landmarkStatus.get(idx);
        if (!current || priority[status] > priority[current]) {
          landmarkStatus.set(idx, status);
        }
      }
    }

    const statusColor = (s: 'good' | 'close' | 'bad' | undefined): string => {
      if (s === 'good') return COLOR_GOOD;
      if (s === 'close') return COLOR_CLOSE;
      if (s === 'bad') return COLOR_BAD;
      return COLOR_NEUTRAL;
    };

    // Draw connections
    ctx.lineWidth = 3;
    for (const [i, j] of POSE_CONNECTIONS) {
      const a = landmarks[i];
      const b = landmarks[j];
      if (!a || !b) continue;

      const sA = landmarkStatus.get(i);
      const sB = landmarkStatus.get(j);
      let seg: 'good' | 'close' | 'bad' | undefined;
      if (sA && sB) {
        seg = priority[sA] >= priority[sB] ? sA : sB;
      } else {
        seg = sA ?? sB;
      }

      ctx.strokeStyle = statusColor(seg);
      ctx.beginPath();
      ctx.moveTo(a.x * w, a.y * h);
      ctx.lineTo(b.x * w, b.y * h);
      ctx.stroke();
    }

    // Draw joints
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (!lm || (lm.visibility ?? 0) < 0.5) continue;
      const color = statusColor(landmarkStatus.get(i));
      ctx.fillStyle = color + '40';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  }

  // ── Rep completed handler ─────────────────────────────────────────────────

  private handleRepCompleted(score: number): void {
    this.setRepCount.update(n => n + 1);
    this.repCount.update(n => n + 1);

    const q = scoreToQuality(score);
    this.lastRepQuality.set(q);

    // Display this rep's score directly
    this.quality.set(score);
    this.qualitySum += score;

    if (q === 'bad') {
      this.feedback.set('Attention à ta posture !');
    } else if (q === 'good') {
      this.feedback.set('Bien, continue comme ça !');
    } else {
      this.feedback.set('Mouvement parfait !');
    }
    setTimeout(() => this.lastRepQuality.set(null), 1000);

    // Check set/workout completion
    if (this.setRepCount() >= this.targetReps()) {
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
  }

  // ── Workout flow ──────────────────────────────────────────────────────────

  startAnalysis(): void {
    this.status.set('ready');
    setTimeout(() => {
      this.status.set('active');
      this.startTimer();
      // Real scoring runs in drawPoseResult — no simulation
    }, 2000);
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => this.elapsedSeconds.update(n => n + 1), 1000);
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

    // Reset rep detector for new set
    if (this.template) {
      this.repDetector = createRepDetector(this.template);
    }

    this.status.set('ready');
    setTimeout(() => {
      this.status.set('active');
    }, 2000);
  }

  finishWorkout(): void {
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

    const avgQuality = this.repCount() > 0
      ? Math.round(this.qualitySum / this.repCount())
      : 0;

    this.sessionsService.create({
      exerciseId: ex.id,
      reps: this.repCount(),
      qualityScore: avgQuality,
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
    clearInterval(this.timerInterval);
    clearInterval(this.restTimer);
    this.poseDetectionActive = false;
    cancelAnimationFrame(this.animFrameId);
    this.stopCamera();
    this.repCount.set(0);
    this.setRepCount.set(0);
    this.currentSet.set(1);
    this.quality.set(0);
    this.elapsedSeconds.set(0);
    this.restElapsed.set(0);
    this.feedback.set('Positionne-toi face à la caméra');
    this.lastRepQuality.set(null);
    this.saveError.set(false);
    this.cameraAvailable.set(true);
    this.template = null;
    this.repDetector = null;
    this.qualitySum = 0;
    this.templateLoaded.set(false);
    this.templateError.set(false);
    this.angleConformity.set({});
    this.status.set('intro');
  }

  private navigateAfterSave(): void {
    const wasProgramRun = this.navService.isProgramRunActive();
    this.navService.endProgramRun();
    this.router.navigate([wasProgramRun ? '/programs' : '/']);
  }

  restartWorkout(): void {
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
    this.quality.set(0);
    this.qualitySum = 0;
    this.elapsedSeconds.set(0);
    this.restElapsed.set(0);
    this.feedback.set('Positionne-toi face à la caméra');
    this.lastRepQuality.set(null);
    this.saveError.set(false);
    if (this.template) {
      this.repDetector = createRepDetector(this.template);
    }
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
