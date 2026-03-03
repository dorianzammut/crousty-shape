import { Component, signal, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { UsersService, AdminUser } from '../../services/users.service';

@Component({
  selector: 'app-users',
  imports: [LucideAngularModule, DatePipe],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-black uppercase italic tracking-tight">
        Gestion des <span class="text-yellow-400">Utilisateurs</span>
      </h2>
      <div class="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <div class="p-6 border-b border-zinc-800 flex justify-between items-center">
          @if (loading()) {
            <span class="font-bold text-zinc-500">Chargement...</span>
          } @else {
            <span class="font-bold">{{ users().length }} utilisateur(s)</span>
          }
        </div>
        <div class="overflow-x-auto">
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
              @for (user of users(); track user.id) {
                <tr class="border-t border-zinc-800 hover:bg-zinc-800/30 transition-colors text-sm">
                  <td class="px-6 py-4 font-medium">{{ user.name }}</td>
                  <td class="px-6 py-4 text-zinc-400">{{ user.email }}</td>
                  <td class="px-6 py-4">
                    <span [class]="user.role === 'ADMIN'
                      ? 'bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase'
                      : 'bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase'">
                      {{ user.role }}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-black">{{ user._count?.sessions ?? 0 }}</td>
                  <td class="px-6 py-4 text-zinc-400">{{ user.createdAt | date:'MMM yyyy' }}</td>
                </tr>
              }
              @if (!loading() && users().length === 0) {
                <tr><td colspan="5" class="px-6 py-10 text-center text-zinc-500">Aucun utilisateur</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);

  users = signal<AdminUser[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.usersService.getAll().subscribe({
      next: users => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
