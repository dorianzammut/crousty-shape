import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-users',
  imports: [LucideAngularModule],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-black uppercase italic tracking-tight">
        Gestion des <span class="text-yellow-400">Utilisateurs</span>
      </h2>
      <div class="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <div class="p-6 border-b border-zinc-800 flex justify-between items-center">
          <span class="font-bold">1 284 utilisateurs</span>
          <button class="bg-yellow-400 text-black px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-yellow-300 transition-colors">
            Exporter
          </button>
        </div>
        <table class="w-full text-left">
          <thead>
            <tr class="text-[10px] text-zinc-500 uppercase tracking-widest bg-zinc-950/50">
              <th class="px-6 py-4 font-bold">Nom</th>
              <th class="px-6 py-4 font-bold">Email</th>
              <th class="px-6 py-4 font-bold">Rôle</th>
              <th class="px-6 py-4 font-bold">Séances</th>
              <th class="px-6 py-4 font-bold">Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            @for (user of users; track user.email) {
              <tr class="border-t border-zinc-800 hover:bg-zinc-800/30 transition-colors text-sm">
                <td class="px-6 py-4 font-medium">{{ user.name }}</td>
                <td class="px-6 py-4 text-zinc-400">{{ user.email }}</td>
                <td class="px-6 py-4">
                  <span [class]="user.role === 'Admin' ? 'bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase' : 'bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase'">
                    {{ user.role }}
                  </span>
                </td>
                <td class="px-6 py-4 font-black">{{ user.sessions }}</td>
                <td class="px-6 py-4 text-zinc-400">{{ user.createdAt }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class UsersComponent {
  users = [
    { name: 'Alex Crousty', email: 'alex@crousty.com', role: 'Admin', sessions: 47, createdAt: 'Jan 2026' },
    { name: 'Marc Durand', email: 'marc@example.com', role: 'User', sessions: 23, createdAt: 'Jan 2026' },
    { name: 'Sophie Bernard', email: 'sophie@example.com', role: 'User', sessions: 18, createdAt: 'Fév 2026' },
    { name: 'Jean Petit', email: 'jean@example.com', role: 'User', sessions: 31, createdAt: 'Fév 2026' },
  ];
}
