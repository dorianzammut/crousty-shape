import { Component, signal, inject, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { SessionsService, AdminSession } from '../../services/sessions.service';

@Component({
  selector: 'app-sessions',
  imports: [DatePipe, DecimalPipe],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-black uppercase italic tracking-tight">
        Séances <span class="text-yellow-400">Analysées</span>
      </h2>
      <div class="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <div class="p-6 border-b border-zinc-800">
          @if (loading()) {
            <span class="text-zinc-500">Chargement...</span>
          } @else {
            <span class="font-bold">{{ sessions().length }} séance(s)</span>
          }
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="text-[10px] text-zinc-500 uppercase tracking-widest bg-zinc-950/50">
                <th class="px-6 py-4 font-bold">Utilisateur</th>
                <th class="px-6 py-4 font-bold">Exercice</th>
                <th class="px-6 py-4 font-bold">Reps</th>
                <th class="px-6 py-4 font-bold">Qualité</th>
                <th class="px-6 py-4 font-bold">Durée</th>
                <th class="px-6 py-4 font-bold">Date</th>
              </tr>
            </thead>
            <tbody>
              @for (session of sessions(); track session.id) {
                <tr class="border-t border-zinc-800 hover:bg-zinc-800/30 transition-colors text-sm">
                  <td class="px-6 py-4 font-medium">{{ session.user.name }}</td>
                  <td class="px-6 py-4 text-zinc-400">{{ session.exercise.name }}</td>
                  <td class="px-6 py-4 font-black">{{ session.reps }}</td>
                  <td class="px-6 py-4">
                    <span [class]="session.qualityScore >= 80
                      ? 'text-yellow-400 font-black'
                      : session.qualityScore >= 60 ? 'text-orange-400 font-black' : 'text-red-400 font-black'">
                      {{ session.qualityScore | number:'1.0-0' }}%
                    </span>
                  </td>
                  <td class="px-6 py-4 text-zinc-400">{{ formatDuration(session.duration) }}</td>
                  <td class="px-6 py-4 text-zinc-500 text-xs">{{ session.createdAt | date:'dd/MM/yy HH:mm' }}</td>
                </tr>
              }
              @if (!loading() && sessions().length === 0) {
                <tr><td colspan="6" class="px-6 py-10 text-center text-zinc-500">Aucune séance</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class SessionsComponent implements OnInit {
  private sessionsService = inject(SessionsService);

  sessions = signal<AdminSession[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.sessionsService.getAll().subscribe({
      next: sessions => {
        this.sessions.set(sessions);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }
}
