import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-black flex flex-col justify-center px-6">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <lucide-icon name="dumbbell" class="text-black" [size]="32"></lucide-icon>
        </div>
        <h1 class="text-white text-2xl font-bold">Créer un compte</h1>
        <p class="text-gray-400 text-sm mt-1">Rejoins Crousty Shape</p>
      </div>

      <!-- Form -->
      <div class="space-y-4">
        <div>
          <label class="text-gray-400 text-xs mb-1 block">Prénom / Pseudo</label>
          <input
            type="text"
            [(ngModel)]="name"
            placeholder="Kevin"
            class="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400"
          />
        </div>
        <div>
          <label class="text-gray-400 text-xs mb-1 block">Email</label>
          <input
            type="email"
            [(ngModel)]="email"
            placeholder="tu@mail.com"
            class="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400"
          />
        </div>
        <div>
          <label class="text-gray-400 text-xs mb-1 block">Mot de passe</label>
          <div class="relative">
            <input
              [type]="showPwd() ? 'text' : 'password'"
              [(ngModel)]="password"
              placeholder="••••••••"
              class="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400 pr-12"
            />
            <button type="button" (click)="togglePwd()"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              <lucide-icon [name]="showPwd() ? 'eye-off' : 'eye'" [size]="18"></lucide-icon>
            </button>
          </div>
        </div>

        @if (error()) {
          <p class="text-red-400 text-sm text-center">{{ error() }}</p>
        }

        <button
          (click)="register()"
          [disabled]="loading()"
          class="w-full bg-yellow-400 text-black font-bold py-4 rounded-xl text-base mt-2 disabled:opacity-50"
        >
          @if (loading()) { Inscription... } @else { Créer mon compte }
        </button>
      </div>

      <p class="text-center text-gray-500 text-sm mt-8">
        Déjà un compte ?
        <a routerLink="/login" class="text-yellow-400 font-semibold">Se connecter</a>
      </p>
    </div>
  `
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  showPwd = signal(false);
  loading = signal(false);
  error = signal('');

  togglePwd() { this.showPwd.update(v => !v); }

  register() {
    if (!this.name || !this.email || !this.password) {
      this.error.set('Remplis tous les champs');
      return;
    }
    if (this.password.length < 8) {
      this.error.set('Le mot de passe doit faire au moins 8 caractères');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.name, this.email, this.password).subscribe({
      next: () => this.router.navigate(['/']),
      error: (e) => {
        this.error.set(e.error?.message || 'Erreur lors de l\'inscription');
        this.loading.set(false);
      },
    });
  }
}
