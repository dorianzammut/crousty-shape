import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-account-settings',
  imports: [LucideAngularModule],
  templateUrl: './account-settings.component.html'
})
export class AccountSettingsComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  user = this.auth.currentUser;

  // Profile form
  name = signal(this.auth.currentUser()?.name ?? '');
  email = signal(this.auth.currentUser()?.email ?? '');
  savingProfile = signal(false);

  // Password form
  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  showCurrentPwd = signal(false);
  showNewPwd = signal(false);
  savingPassword = signal(false);

  // Avatar color picker (stored in localStorage)
  readonly avatarColors = ['#facc15', '#3b82f6', '#22c55e', '#ef4444', '#a855f7', '#ec4899'];
  avatarColor = signal(localStorage.getItem('avatarColor') ?? '#facc15');

  // Toast
  toast = signal<{ msg: string; type: 'success' | 'error' } | null>(null);

  back() {
    this.router.navigate(['/profile']);
  }

  selectColor(color: string) {
    this.avatarColor.set(color);
    localStorage.setItem('avatarColor', color);
  }

  saveProfile() {
    const n = this.name().trim();
    const e = this.email().trim();
    if (!n || !e) { this.showToast('Nom et email requis', 'error'); return; }

    this.savingProfile.set(true);
    this.auth.updateProfile({ name: n, email: e }).subscribe({
      next: () => {
        this.savingProfile.set(false);
        this.showToast('Profil mis à jour', 'success');
      },
      error: () => {
        this.savingProfile.set(false);
        this.showToast('Erreur lors de la mise à jour', 'error');
      }
    });
  }

  savePassword() {
    const cur = this.currentPassword();
    const next = this.newPassword();
    const conf = this.confirmPassword();

    if (!cur || !next || !conf) { this.showToast('Tous les champs sont requis', 'error'); return; }
    if (next !== conf) { this.showToast('Les mots de passe ne correspondent pas', 'error'); return; }
    if (next.length < 6) { this.showToast('Minimum 6 caractères', 'error'); return; }

    this.savingPassword.set(true);
    this.auth.changePassword({ currentPassword: cur, newPassword: next }).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
        this.showToast('Mot de passe modifié', 'success');
      },
      error: () => {
        this.savingPassword.set(false);
        this.showToast('Mot de passe actuel incorrect', 'error');
      }
    });
  }

  get userInitial(): string {
    return (this.name() || this.email() || '').charAt(0).toUpperCase();
  }

  private showToast(msg: string, type: 'success' | 'error') {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 2500);
  }
}
