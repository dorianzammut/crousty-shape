import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SessionsService, Session } from '../../services/sessions.service';
import { NgStyle } from '@angular/common';

interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

@Component({
  selector: 'app-profile',
  imports: [LucideAngularModule, NgStyle],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private sessionsService = inject(SessionsService);

  user = this.auth.currentUser;
  weekSessionCount = signal(0);
  weekAvgQuality = signal<number | null>(null);
  achievements = signal<Achievement[]>([]);
  selectedAchievement = signal<Achievement | null>(null);
  toast = signal<string | null>(null);

  unlockedCount = computed(() => this.achievements().filter(a => a.unlocked).length);

  menuItems = [
    { label: 'Paramètres du compte', icon: 'settings', action: () => this.router.navigate(['/settings']) },
    { label: "Préférences d'entraînement", icon: 'sliders-horizontal', action: () => this.showToast('Fonctionnalité bientôt disponible') },
  ];

  ngOnInit() {
    this.sessionsService.getMine().subscribe({
      next: sessions => {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recent = sessions.filter(s => new Date(s.createdAt).getTime() >= sevenDaysAgo);
        this.weekSessionCount.set(recent.length);
        if (recent.length > 0) {
          const avg = recent.reduce((sum, s) => sum + s.qualityScore, 0) / recent.length;
          this.weekAvgQuality.set(Math.round(avg));
        }
        this.achievements.set(this.buildAchievements(sessions));
      },
    });
  }

  private buildAchievements(sessions: Session[]): Achievement[] {
    const defs: (Omit<Achievement, 'unlocked'> & { check: (s: Session[]) => boolean })[] = [
      {
        id: 'first',
        label: 'Premier pas',
        description: 'Compléter ta 1ère séance',
        icon: 'target',
        check: s => s.length >= 1,
      },
      {
        id: 'regular',
        label: 'Régulier',
        description: '5 séances au total',
        icon: 'calendar',
        check: s => s.length >= 5,
      },
      {
        id: 'veteran',
        label: 'Vétéran',
        description: '20 séances au total',
        icon: 'award',
        check: s => s.length >= 20,
      },
      {
        id: 'early-bird',
        label: 'Lève-tôt',
        description: 'Séance avant 8h du matin',
        icon: 'clock',
        check: s => s.some(x => new Date(x.createdAt).getHours() < 8),
      },
      {
        id: 'streak',
        label: 'Série de 7j',
        description: '7 jours consécutifs d\'entraînement',
        icon: 'flame',
        check: s => this.hasConsecutiveDays(s, 7),
      },
      {
        id: 'quality',
        label: 'Perfectionniste',
        description: 'Score qualité ≥ 90% en une séance',
        icon: 'star',
        check: s => s.some(x => x.qualityScore >= 90),
      },
      {
        id: 'arms',
        label: "Bras d'acier",
        description: '5 séances de Bras',
        icon: 'dumbbell',
        check: s => s.filter(x => x.exercise.category === 'Bras').length >= 5,
      },
      {
        id: 'legs',
        label: 'Jambes de feu',
        description: '5 séances de Jambes',
        icon: 'trending-up',
        check: s => s.filter(x => x.exercise.category === 'Jambes').length >= 5,
      },
    ];

    return defs.map(({ check, ...d }) => ({ ...d, unlocked: check(sessions) }));
  }

  private hasConsecutiveDays(sessions: Session[], n: number): boolean {
    const DAY = 86_400_000;
    const dates = [...new Set(
      sessions.map(s => {
        const d = new Date(s.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    )].sort((a, b) => a - b);

    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      streak = dates[i] - dates[i - 1] === DAY ? streak + 1 : 1;
      if (streak >= n) return true;
    }
    return dates.length >= n && streak >= n;
  }

  logout() {
    this.auth.logout();
  }

  showToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(null), 2500);
  }

  get userInitial(): string {
    return (this.user()?.name || this.user()?.email || '').charAt(0).toUpperCase();
  }

  get userName(): string {
    return this.user()?.name || this.user()?.email?.split('@')[0] || '';
  }

  get avatarColor(): string {
    return localStorage.getItem('avatarColor') ?? '#facc15';
  }
}
