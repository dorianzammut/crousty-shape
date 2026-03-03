import { Component, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { SessionsService, Session } from '../../services/sessions.service';

@Component({
  selector: 'app-dashboard',
  imports: [LucideAngularModule, BaseChartDirective, DecimalPipe],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private sessionsService = inject(SessionsService);

  userName = signal(this.auth.currentUser()?.name || this.auth.currentUser()?.email?.split('@')[0] || 'toi');
  sessions = signal<Session[]>([]);
  loading = signal(true);

  chartData: ChartData<'line'> = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [{
      data: [0, 0, 0, 0, 0, 0, 0],
      borderColor: '#facc15',
      borderWidth: 3,
      backgroundColor: 'rgba(250, 204, 21, 0.15)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#facc15',
      pointRadius: 4,
    }]
  };

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181b',
        borderColor: '#3f3f46',
        borderWidth: 1,
        titleColor: '#facc15',
        bodyColor: '#facc15',
      }
    },
    scales: {
      x: {
        ticks: { color: '#71717a', font: { size: 10 } },
        grid: { display: false },
        border: { display: false }
      },
      y: { display: false }
    }
  };

  ngOnInit() {
    this.sessionsService.getMine().subscribe({
      next: sessions => {
        this.sessions.set(sessions.slice(0, 5));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.sessionsService.getStats().subscribe({
      next: stats => {
        this.chartData = {
          ...this.chartData,
          labels: stats.labels,
          datasets: [{ ...this.chartData.datasets[0], data: stats.data }]
        };
      },
    });
  }

  get totalReps(): number {
    return this.sessions().reduce((sum, s) => sum + s.reps, 0);
  }

  formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  goToExercises(): void { this.router.navigate(['/exercises']); }
  goToWorkout(): void { this.router.navigate(['/workout']); }
}
