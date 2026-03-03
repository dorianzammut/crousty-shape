import { Component, signal, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { UsersService, AdminUser } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-users',
  imports: [LucideAngularModule, DatePipe, FormsModule],
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
          <button
            (click)="openCreateModal()"
            class="flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-yellow-300 transition-colors">
            <lucide-icon name="user-plus" [size]="16"></lucide-icon>
            Créer un utilisateur
          </button>
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
                <th class="px-6 py-4 font-bold w-16"></th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr class="border-t border-zinc-800 hover:bg-zinc-800/30 transition-colors text-sm">
                  <td class="px-6 py-4 font-medium">{{ user.name }}</td>
                  <td class="px-6 py-4 text-zinc-400">{{ user.email }}</td>
                  <td class="px-6 py-4">
                    <span [class]="getRoleBadgeClass(user.role)">
                      {{ user.role }}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-black">{{ user._count?.sessions ?? 0 }}</td>
                  <td class="px-6 py-4 text-zinc-400">{{ user.createdAt | date:'dd MMM yyyy' }}</td>
                  <td class="px-6 py-4">
                    @if (!isCurrentUser(user.id)) {
                      <button
                        (click)="openDeleteModal(user)"
                        class="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                        <lucide-icon name="trash-2" [size]="16"></lucide-icon>
                      </button>
                    }
                  </td>
                </tr>
              }
              @if (!loading() && users().length === 0) {
                <tr><td colspan="6" class="px-6 py-10 text-center text-zinc-500">Aucun utilisateur</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    @if (showCreateModal()) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="closeModals()">
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md mx-4 p-6 space-y-5" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-black uppercase italic">
              Nouveau <span class="text-yellow-400">Compte</span>
            </h3>
            <button (click)="closeModals()" class="text-zinc-500 hover:text-white transition-colors">
              <lucide-icon name="x" [size]="20"></lucide-icon>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nom</label>
              <input
                [(ngModel)]="form.name"
                type="text"
                placeholder="Jean Dupont"
                class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400" />
            </div>
            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Email</label>
              <input
                [(ngModel)]="form.email"
                type="email"
                placeholder="jean@croustyshape.com"
                class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400" />
            </div>
            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Mot de passe</label>
              <input
                [(ngModel)]="form.password"
                type="password"
                placeholder="••••••••"
                class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400" />
            </div>
            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Rôle</label>
              <div class="flex gap-3">
                <button
                  (click)="form.role = 'ADMIN'"
                  [class]="form.role === 'ADMIN'
                    ? 'flex-1 py-2.5 rounded-lg text-sm font-bold border-2 border-yellow-400 bg-yellow-400/10 text-yellow-400'
                    : 'flex-1 py-2.5 rounded-lg text-sm font-bold border-2 border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'">
                  Admin
                </button>
                <button
                  (click)="form.role = 'COACH'"
                  [class]="form.role === 'COACH'
                    ? 'flex-1 py-2.5 rounded-lg text-sm font-bold border-2 border-yellow-400 bg-yellow-400/10 text-yellow-400'
                    : 'flex-1 py-2.5 rounded-lg text-sm font-bold border-2 border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'">
                  Coach
                </button>
              </div>
            </div>
          </div>

          @if (error()) {
            <p class="text-red-400 text-sm">{{ error() }}</p>
          }

          <div class="flex gap-3 pt-2">
            <button (click)="closeModals()" class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
              Annuler
            </button>
            <button
              (click)="submitCreate()"
              [disabled]="submitting()"
              class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-yellow-400 text-black hover:bg-yellow-300 transition-colors disabled:opacity-50">
              {{ submitting() ? 'Création...' : 'Créer le compte' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Delete Confirmation Modal -->
    @if (showDeleteModal()) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="closeModals()">
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm mx-4 p-6 space-y-5" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-black uppercase italic">
              Supprimer <span class="text-red-400">Utilisateur</span>
            </h3>
            <button (click)="closeModals()" class="text-zinc-500 hover:text-white transition-colors">
              <lucide-icon name="x" [size]="20"></lucide-icon>
            </button>
          </div>

          <p class="text-sm text-zinc-400">
            Supprimer le compte de
            <span class="text-white font-bold">{{ userToDelete()?.name }}</span>
            (<span class="text-zinc-300">{{ userToDelete()?.email }}</span>) ?
            Cette action est irréversible.
          </p>

          @if (error()) {
            <p class="text-red-400 text-sm">{{ error() }}</p>
          }

          <div class="flex gap-3 pt-2">
            <button (click)="closeModals()" class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
              Annuler
            </button>
            <button
              (click)="confirmDelete()"
              [disabled]="submitting()"
              class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-400 transition-colors disabled:opacity-50">
              {{ submitting() ? 'Suppression...' : 'Supprimer' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private auth = inject(AuthService);

  users = signal<AdminUser[]>([]);
  loading = signal(true);
  showCreateModal = signal(false);
  showDeleteModal = signal(false);
  submitting = signal(false);
  error = signal('');
  userToDelete = signal<AdminUser | null>(null);

  form = { name: '', email: '', password: '', role: 'COACH' };

  ngOnInit() {
    this.loadUsers();
  }

  isCurrentUser(id: string): boolean {
    return this.auth.currentUser()?.id === id;
  }

  openCreateModal() {
    this.form = { name: '', email: '', password: '', role: 'COACH' };
    this.error.set('');
    this.showCreateModal.set(true);
  }

  openDeleteModal(user: AdminUser) {
    this.userToDelete.set(user);
    this.error.set('');
    this.showDeleteModal.set(true);
  }

  closeModals() {
    this.showCreateModal.set(false);
    this.showDeleteModal.set(false);
    this.userToDelete.set(null);
  }

  submitCreate() {
    if (!this.form.name || !this.form.email || !this.form.password) {
      this.error.set('Tous les champs sont requis.');
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    this.usersService.create(this.form).subscribe({
      next: user => {
        this.users.update(list => [user, ...list]);
        this.submitting.set(false);
        this.closeModals();
      },
      error: err => {
        this.error.set(err.error?.message || 'Erreur lors de la création.');
        this.submitting.set(false);
      },
    });
  }

  confirmDelete() {
    const user = this.userToDelete();
    if (!user) return;

    this.submitting.set(true);
    this.error.set('');

    this.usersService.delete(user.id).subscribe({
      next: () => {
        this.users.update(list => list.filter(u => u.id !== user.id));
        this.submitting.set(false);
        this.closeModals();
      },
      error: err => {
        this.error.set(err.error?.message || 'Erreur lors de la suppression.');
        this.submitting.set(false);
      },
    });
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase';
      case 'COACH':
        return 'bg-blue-400/20 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase';
      default:
        return 'bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase';
    }
  }

  private loadUsers() {
    this.usersService.getAll().subscribe({
      next: users => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
