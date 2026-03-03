import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <!-- Header -->
        <div class="text-center mb-10">
          <div class="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <lucide-icon name="dumbbell" class="text-black" [size]="28"></lucide-icon>
          </div>
          <h1 class="text-white text-2xl font-bold">Administration</h1>
          <p class="text-gray-500 text-sm mt-1">Crousty Shape — Accès restreint</p>
        </div>

        <!-- Card -->
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-5">
          <div>
            <label class="text-gray-400 text-xs font-medium block mb-2">Email administrateur</label>
            <input
              type="email"
              [(ngModel)]="email"
              placeholder="admin@croustyshape.com"
              class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400 text-sm"
            />
          </div>
          <div>
            <label class="text-gray-400 text-xs font-medium block mb-2">Mot de passe</label>
            <div class="relative">
              <input
                [type]="showPwd() ? 'text' : 'password'"
                [(ngModel)]="password"
                placeholder="••••••••"
                class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400 text-sm pr-11"
              />
              <button type="button" (click)="togglePwd()"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <lucide-icon [name]="showPwd() ? 'eye-off' : 'eye'" [size]="16"></lucide-icon>
              </button>
            </div>
          </div>

          @if (error()) {
            <div class="flex items-center gap-2 bg-red-900/30 border border-red-800 rounded-xl px-4 py-3">
              <lucide-icon name="alert-circle" class="text-red-400 shrink-0" [size]="16"></lucide-icon>
              <p class="text-red-400 text-sm">{{ error() }}</p>
            </div>
          }

          <button
            (click)="login()"
            [disabled]="loading()"
            class="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            @if (loading()) { Connexion en cours... } @else { Se connecter }
          </button>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  showPwd = signal(false);
  loading = signal(false);
  error = signal('');

  togglePwd() { this.showPwd.update(v => !v); }

  login() {
    if (!this.email || !this.password) {
      this.error.set('Remplis tous les champs');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
          const dest = res.user.role === 'COACH' ? '/my-exercises' : '/dashboard';
          this.router.navigate([dest]);
        },
      error: (e) => {
        this.error.set(e.message || e.error?.message || 'Identifiants incorrects');
        this.loading.set(false);
      },
    });
  }
}
