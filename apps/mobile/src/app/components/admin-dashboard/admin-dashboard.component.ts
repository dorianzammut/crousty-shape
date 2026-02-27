import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

interface Stat {
  label: string;
  value: string;
  change: string;
  icon: string;
}

interface Alert {
  user: string;
  exercise: string;
  alert: string;
  status: string;
  time: string;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [LucideAngularModule, BaseChartDirective],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent {
  stats: Stat[] = [
    { label: 'Utilisateurs Actifs', value: '1,284', change: '+12%', icon: 'users' },
    { label: 'Séances Analysées', value: '45,021', change: '+24%', icon: 'dumbbell' },
    { label: 'Revenu Mensuel', value: '12,450€', change: '+8%', icon: 'bar-chart-3' },
    { label: 'Précision IA', value: '94.2%', change: '+1.4%', icon: 'settings' },
  ];

  alerts: Alert[] = [
    { user: 'Marc Durand', exercise: 'Soulevé de terre', alert: 'Dos rond détecté (répété)', status: 'Critique', time: 'il y a 2m' },
    { user: 'Sophie Bernard', exercise: 'Squat', alert: 'Amplitude insuffisante', status: 'Modéré', time: 'il y a 5m' },
    { user: 'Jean Petit', exercise: 'Développé Couché', alert: 'Asymétrie des coudes', status: 'Modéré', time: 'il y a 12m' },
  ];

  growthChartData: ChartData<'line'> = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [{
      label: 'Utilisateurs',
      data: [400, 600, 800, 1100, 1284],
      borderColor: '#facc15',
      borderWidth: 4,
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
      tooltip: {
        backgroundColor: '#18181b',
        borderColor: '#3f3f46',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#facc15',
      }
    },
    scales: {
      x: {
        ticks: { color: '#71717a', font: { size: 12 } },
        grid: { display: false },
        border: { display: false }
      },
      y: {
        ticks: { color: '#71717a', font: { size: 12 } },
        grid: { color: '#27272a' },
        border: { display: false }
      }
    }
  };

  barChartData: ChartData<'bar'> = {
    labels: ['Jambes', 'Bras', 'Dos', 'Pec'],
    datasets: [{
      data: [400, 300, 200, 500],
      backgroundColor: '#facc15',
      borderRadius: 4,
    }]
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181b',
        borderColor: '#3f3f46',
        borderWidth: 1,
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

  getStatusClass(status: string): string {
    return status === 'Critique'
      ? 'px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-500'
      : 'px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-500/20 text-orange-500';
  }
}
