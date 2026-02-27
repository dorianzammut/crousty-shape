import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-alerts',
  imports: [LucideAngularModule],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-black uppercase italic tracking-tight">
        Alertes <span class="text-yellow-400">Performance</span>
      </h2>
      <div class="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[10px] text-zinc-500 uppercase tracking-widest bg-zinc-950/50">
              <th class="px-6 py-4 font-bold">Utilisateur</th>
              <th class="px-6 py-4 font-bold">Exercice</th>
              <th class="px-6 py-4 font-bold">Alerte</th>
              <th class="px-6 py-4 font-bold">Sévérité</th>
              <th class="px-6 py-4 font-bold">Heure</th>
            </tr>
          </thead>
          <tbody>
            @for (alert of alerts; track alert.user + alert.time) {
              <tr class="border-t border-zinc-800 hover:bg-zinc-800/30 transition-colors text-sm">
                <td class="px-6 py-4 font-medium">{{ alert.user }}</td>
                <td class="px-6 py-4 text-zinc-400">{{ alert.exercise }}</td>
                <td class="px-6 py-4 flex items-center gap-2 text-red-400">
                  <lucide-icon name="alert-circle" [size]="14"></lucide-icon>
                  {{ alert.message }}
                </td>
                <td class="px-6 py-4">
                  <span [class]="alert.severity === 'Critique' ? 'bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase' : 'bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase'">
                    {{ alert.severity }}
                  </span>
                </td>
                <td class="px-6 py-4 text-zinc-500 text-xs">{{ alert.time }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AlertsComponent {
  alerts = [
    { user: 'Marc Durand', exercise: 'Soulevé de terre', message: 'Dos rond détecté (répété)', severity: 'Critique', time: 'il y a 2m' },
    { user: 'Sophie Bernard', exercise: 'Squat', message: 'Amplitude insuffisante', severity: 'Modéré', time: 'il y a 5m' },
    { user: 'Jean Petit', exercise: 'Développé Couché', message: 'Asymétrie des coudes', severity: 'Modéré', time: 'il y a 12m' },
  ];
}
