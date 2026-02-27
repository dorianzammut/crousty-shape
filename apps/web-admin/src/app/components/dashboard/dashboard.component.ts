import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  imports: [LucideAngularModule, BaseChartDirective],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  stats = [
    { label: 'Utilisateurs Actifs', value: '1,284', change: '+12%', icon: 'users' },
    { label: 'Séances Analysées', value: '45,021', change: '+24%', icon: 'dumbbell' },
    { label: 'Revenu Mensuel', value: '12,450€', change: '+8%', icon: 'bar-chart-3' },
    { label: 'Précision IA', value: '94.2%', change: '+1.4%', icon: 'trending-up' },
  ];

  growthChartData: ChartData<'line'> = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'],
    datasets: [{
      label: 'Utilisateurs',
      data: [400, 600, 800, 1100, 1284],
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
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#18181b', borderColor: '#3f3f46', borderWidth: 1 }
    },
    scales: {
      x: { ticks: { color: '#71717a' }, grid: { display: false }, border: { display: false } },
      y: { ticks: { color: '#71717a' }, grid: { color: '#27272a' }, border: { display: false } }
    }
  };

  barChartData: ChartData<'bar'> = {
    labels: ['Jambes', 'Bras', 'Dos', 'Pec'],
    datasets: [{ data: [400, 300, 200, 500], backgroundColor: '#facc15', borderRadius: 4 }]
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#71717a' }, grid: { display: false }, border: { display: false } },
      y: { display: false }
    }
  };
}
