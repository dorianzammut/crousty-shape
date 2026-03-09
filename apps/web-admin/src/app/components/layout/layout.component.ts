import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './layout.component.html'
})
export class LayoutComponent {
  private auth = inject(AuthService);

  sidebarOpen = signal(true);
  currentUser = this.auth.currentUser;

  get navItems(): NavItem[] {
    const role = this.currentUser()?.role;
    if (role === 'COACH') {
      return [
        { path: 'my-exercises', label: 'Mes Exercices', icon: 'clipboard-list' },
        { path: 'catalogue', label: 'Catalogue', icon: 'book-open' },
      ];
    }
    return [
      { path: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
      { path: 'users', label: 'Utilisateurs', icon: 'users' },
      { path: 'sessions', label: 'Séances', icon: 'dumbbell' },
      { path: 'catalogue', label: 'Catalogue', icon: 'book-open' },
      { path: 'settings', label: 'Paramètres', icon: 'settings' },
    ];
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  userLabel(): string {
    const email = this.currentUser()?.email;
    return email ? email.split('@')[0] : '';
  }

  logout(): void {
    this.auth.logout();
  }
}
