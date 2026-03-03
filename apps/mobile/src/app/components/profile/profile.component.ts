import { Component, OnInit, signal, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SessionsService } from '../../services/sessions.service';

@Component({
  selector: 'app-profile',
  imports: [LucideAngularModule],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private sessionsService = inject(SessionsService);

  user = this.auth.currentUser;
  sessionCount = signal(0);
  progressWidth = '0%';

  menuItems = [
    { label: 'Paramètres du compte', icon: 'settings' },
    { label: "Préférences d'entraînement", icon: 'heart' },
    { label: 'Historique des paiements', icon: 'chevron-right' },
  ];

  badges = [
    { label: 'Série de 7j' },
    { label: 'Lève-tôt' },
    { label: "Bras d'acier" },
    { label: 'Poids Plume' },
  ];

  ngOnInit() {
    setTimeout(() => { this.progressWidth = '65%'; }, 300);

    this.sessionsService.getMine().subscribe({
      next: sessions => this.sessionCount.set(sessions.length),
    });
  }

  logout() {
    this.auth.logout();
  }

  get userInitial(): string {
    const name = this.user()?.email ?? '';
    return name.charAt(0).toUpperCase();
  }

  get userName(): string {
    return this.user()?.email?.split('@')[0] ?? '';
  }
}
