import { Component, signal, inject, OnInit } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-dashboard',
  imports: [LucideAngularModule, BaseChartDirective],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private usersService = inject(UsersService);

  stats = signal([
    { label: 'Utilisateurs', value: '—', icon: 'users' },
    { label: 'Séances Analysées', value: '—', icon: 'dumbbell' },
    { label: 'Alertes Actives', value: '—', icon: 'alert-circle' },
    { label: 'Précision IA', value: '94.2%', icon: 'trending-up' },
  ]);

  growthChartData: ChartData<'line'> = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'],
    datasets: [{
      label: 'Utilisateurs',
      data: [0, 0, 0, 0, 0],
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
      y: { ticks: { color: '#71717a' }, grid: { color: '#27272a' }, border: { display: false } }
    }
  };

  barChartData: ChartData<'bar'> = {
    labels: ['Jambes', 'Bras', 'Dos', 'Pec'],
    datasets: [{ data: [0, 0, 0, 0], backgroundColor: '#facc15', borderRadius: 4 }]
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

  ngOnInit() {
    this.usersService.getStats().subscribe({
      next: s => {
        this.stats.set([
          { label: 'Utilisateurs', value: s.users.toLocaleString('fr'), icon: 'users' },
          { label: 'Séances Analysées', value: s.sessions.toLocaleString('fr'), icon: 'dumbbell' },
          { label: 'Alertes Actives', value: s.alerts.toLocaleString('fr'), icon: 'alert-circle' },
          { label: 'Précision IA', value: '94.2%', icon: 'trending-up' },
        ]);
      },
    });
  }
}
