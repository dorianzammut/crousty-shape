import { Component, OnInit, OnDestroy, ElementRef, ViewChild, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NavigationService } from '../../services/navigation.service';

type WorkoutStatus = 'waiting' | 'ready' | 'active' | 'finished';
type RepQuality = 'perfect' | 'good' | 'bad' | null;

@Component({
  selector: 'app-workout-live',
  imports: [LucideAngularModule],
  templateUrl: './workout-live.component.html'
})
export class WorkoutLiveComponent implements OnInit, OnDestroy {
  @ViewChild('skeletonCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private router = inject(Router);
  navService = inject(NavigationService);

  repCount = signal(0);
  status = signal<WorkoutStatus>('waiting');
  quality = signal(100);
  feedback = signal('Positionne-toi face à la caméra');
  lastRepQuality = signal<RepQuality>(null);

  private repInterval: any;
  private animFrameId: number = 0;
  private frame = 0;

  get exercise(): any {
    return this.navService.selectedExercise();
  }

  ngOnInit(): void {
    setTimeout(() => this.startCanvasAnimation(), 100);
  }

  ngOnDestroy(): void {
    clearInterval(this.repInterval);
    cancelAnimationFrame(this.animFrameId);
  }

  startAnalysis(): void {
    this.status.set('ready');
    setTimeout(() => {
      this.status.set('active');
      this.startRepSimulation();
    }, 2000);
  }

  private startRepSimulation(): void {
    this.repInterval = setInterval(() => {
      if (this.repCount() >= 9) {
        clearInterval(this.repInterval);
        this.status.set('finished');
        return;
      }

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
    }, 3000);
  }

  private startCanvasAnimation(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      this.frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const st = this.status();
      if (st === 'waiting' || st === 'ready' || st === 'active') {
        const time = this.frame * 0.05;
        const offset = Math.sin(time) * 20;

        ctx.strokeStyle = st === 'active'
          ? (this.lastRepQuality() === 'bad' ? '#ef4444' : '#facc15')
          : '#71717a';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        // Head
        ctx.beginPath();
        ctx.arc(cx + offset * 0.1, cy - 100 + offset * 0.2, 20, 0, Math.PI * 2);
        ctx.stroke();

        // Spine
        ctx.beginPath();
        ctx.moveTo(cx + offset * 0.1, cy - 80 + offset * 0.2);
        ctx.lineTo(cx + offset * 0.2, cy + 20 + offset * 0.3);
        ctx.stroke();

        // Shoulders
        ctx.beginPath();
        ctx.moveTo(cx - 40, cy - 70 + offset * 0.2);
        ctx.lineTo(cx + 40, cy - 70 + offset * 0.2);
        ctx.stroke();

        // Left arm
        ctx.beginPath();
        ctx.moveTo(cx - 40, cy - 70 + offset * 0.2);
        ctx.lineTo(cx - 80, cy - 20 + Math.sin(time) * 40);
        ctx.lineTo(cx - 100, cy + 30 + Math.sin(time) * 20);
        ctx.stroke();

        // Right arm
        ctx.beginPath();
        ctx.moveTo(cx + 40, cy - 70 + offset * 0.2);
        ctx.lineTo(cx + 80, cy - 20 + Math.sin(time) * 40);
        ctx.lineTo(cx + 100, cy + 30 + Math.sin(time) * 20);
        ctx.stroke();

        // Legs
        const squat = Math.max(0, Math.sin(time) * 40);
        ctx.beginPath();
        ctx.moveTo(cx - 20, cy + 20 + offset * 0.3);
        ctx.lineTo(cx - 40, cy + 80 - squat);
        ctx.lineTo(cx - 50, cy + 160);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + 20, cy + 20 + offset * 0.3);
        ctx.lineTo(cx + 40, cy + 80 - squat);
        ctx.lineTo(cx + 50, cy + 160);
        ctx.stroke();

        // Keypoints
        const points: [number, number][] = [
          [cx + offset * 0.1, cy - 100 + offset * 0.2],
          [cx - 40, cy - 70 + offset * 0.2],
          [cx + 40, cy - 70 + offset * 0.2],
          [cx - 80, cy - 20 + Math.sin(time) * 40],
          [cx + 80, cy - 20 + Math.sin(time) * 40],
          [cx - 20, cy + 20 + offset * 0.3],
          [cx + 20, cy + 20 + offset * 0.3],
        ];

        ctx.fillStyle = ctx.strokeStyle;
        points.forEach(([px, py]) => {
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      this.animFrameId = requestAnimationFrame(animate);
    };

    this.animFrameId = requestAnimationFrame(animate);
  }

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

  finishWorkout(): void {
    this.status.set('finished');
    clearInterval(this.repInterval);
  }

  restartWorkout(): void {
    this.repCount.set(0);
    this.quality.set(100);
    this.feedback.set('Positionne-toi face à la caméra');
    this.lastRepQuality.set(null);
    this.status.set('waiting');
    clearInterval(this.repInterval);
  }

  close(): void {
    this.router.navigate(['/']);
  }
}
