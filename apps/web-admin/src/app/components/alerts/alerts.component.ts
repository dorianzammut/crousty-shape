import { Component, signal, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AlertsService, AlertItem } from '../../services/alerts.service';

@Component({
  selector: 'app-alerts',
  imports: [LucideAngularModule, DatePipe],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-black uppercase italic tracking-tight">
        Alertes <span class="text-yellow-400">Performance</span>
      </h2>
      <div class="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <div class="p-6 border-b border-zinc-800">
          @if (loading()) {
            <span class="text-zinc-500">Chargement...</span>
          } @else {
            <span class="font-bold">{{ alerts().length }} alerte(s)</span>
          }
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="text-[10px] text-zinc-500 uppercase tracking-widest bg-zinc-950/50">
                <th class="px-6 py-4 font-bold">Utilisateur</th>
                <th class="px-6 py-4 font-bold">Exercice</th>
                <th class="px-6 py-4 font-bold">Alerte</th>
                <th class="px-6 py-4 font-bold">Sévérité</th>
                <th class="px-6 py-4 font-bold">Date</th>
              </tr>
            </thead>
            <tbody>
              @for (alert of alerts(); track alert.id) {
                <tr class="border-t border-zinc-800 hover:bg-zinc-800/30 transition-colors text-sm">
                  <td class="px-6 py-4 font-medium">{{ alert.user.name }}</td>
                  <td class="px-6 py-4 text-zinc-400">{{ alert.exercise.name }}</td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2 text-red-400">
                      <lucide-icon name="alert-circle" [size]="14"></lucide-icon>
                      {{ alert.message }}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span [class]="alert.severity === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase'
                      : 'bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase'">
                      {{ alert.severity === 'CRITICAL' ? 'Critique' : 'Modéré' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-zinc-500 text-xs">{{ alert.createdAt | date:'dd/MM HH:mm' }}</td>
                </tr>
              }
              @if (!loading() && alerts().length === 0) {
                <tr><td colspan="5" class="px-6 py-10 text-center text-zinc-500">Aucune alerte</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AlertsComponent implements OnInit {
  private alertsService = inject(AlertsService);

  alerts = signal<AlertItem[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.alertsService.getAll().subscribe({
      next: alerts => {
        this.alerts.set(alerts);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
