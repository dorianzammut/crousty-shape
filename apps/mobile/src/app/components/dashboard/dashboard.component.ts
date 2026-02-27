import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

interface Session {
  title: string;
  date: string;
  score: number;
  reps: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [LucideAngularModule, BaseChartDirective],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  constructor(private router: Router) {}

  sessions: Session[] = [
    { title: 'Full Body A', date: 'Hier', score: 92, reps: 450 },
    { title: 'Push Day', date: '2 fév.', score: 88, reps: 380 },
    { title: 'Leg Day', date: '30 janv.', score: 95, reps: 520 },
  ];

  chartData: ChartData<'line'> = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [{
      data: [120, 150, 180, 140, 210, 190, 250],
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

  goToExercises(): void {
    this.router.navigate(['/exercises']);
  }

  goToWorkout(): void {
    this.router.navigate(['/workout']);
  }
}
