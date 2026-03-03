import { Component, signal, inject, OnInit, ViewChild } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { UsersService } from '../../services/users.service';
import { ExercisesService } from '../../services/exercises.service';
import { getCategoryLabel } from '../../constants/exercise-categories';

interface RangeOption { label: string; value: string }

@Component({
  selector: 'app-dashboard',
  imports: [LucideAngularModule, BaseChartDirective],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private usersService = inject(UsersService);
  private exercisesService = inject(ExercisesService);

  @ViewChild('growthChart', { read: BaseChartDirective }) growthChart?: BaseChartDirective;
  @ViewChild('barChart', { read: BaseChartDirective }) barChart?: BaseChartDirective;

  stats = signal([
    { label: 'Utilisateurs', value: '—', icon: 'users' },
    { label: 'Séances Analysées', value: '—', icon: 'dumbbell' },
    { label: 'Précision IA', value: '94.2%', icon: 'trending-up' },
  ]);

  ranges: RangeOption[] = [
    { label: 'Semaine', value: 'week' },
    { label: 'Mois', value: 'month' },
    { label: 'Année', value: 'year' },
    { label: '5 Ans', value: '5years' },
  ];
  activeRange = signal('month');

  growthChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'Utilisateurs',
      data: [],
      borderColor: '#facc15',
      borderWidth: 3,
      backgroundColor: 'rgba(250, 204, 21, 0.15)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#facc15',
    }]
  };

  growthChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#18181b', borderColor: '#3f3f46', borderWidth: 1 } },
    scales: {
      x: { ticks: { color: '#71717a' }, grid: { display: false }, border: { display: false } },
      y: {
        ticks: { color: '#71717a', stepSize: 1 },
        grid: { color: '#27272a' },
        border: { display: false },
        beginAtZero: true,
      }
    }
  };

  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: '#facc15', borderRadius: 4 }]
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#71717a' }, grid: { display: false }, border: { display: false } },
      y: { ticks: { color: '#71717a', stepSize: 1 }, grid: { color: '#27272a' }, border: { display: false }, beginAtZero: true }
    }
  };

  ngOnInit() {
    this.usersService.getStats().subscribe({
      next: s => {
        this.stats.set([
          { label: 'Utilisateurs', value: s.users.toLocaleString('fr'), icon: 'users' },
          { label: 'Séances Analysées', value: s.sessions.toLocaleString('fr'), icon: 'dumbbell' },
          { label: 'Précision IA', value: '94.2%', icon: 'trending-up' },
        ]);
      },
    });

    this.loadGrowth('month');
    this.loadCategories();
  }

  selectRange(range: string) {
    this.activeRange.set(range);
    this.loadGrowth(range);
  }

  private loadGrowth(range: string) {
    this.usersService.getGrowth(range).subscribe({
      next: g => {
        this.growthChartData.labels = g.labels;
        this.growthChartData.datasets[0].data = g.data;
        this.growthChart?.update();
      },
    });
  }

  private loadCategories() {
    this.exercisesService.getCategories().subscribe({
      next: cats => {
        this.barChartData.labels = cats.map(c => getCategoryLabel(c.label));
        this.barChartData.datasets[0].data = cats.map(c => c.count);
        this.barChart?.update();
      },
    });
  }
}
