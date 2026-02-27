import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

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
  sidebarOpen = signal(true);

  navItems: NavItem[] = [
    { path: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { path: 'users', label: 'Utilisateurs', icon: 'users' },
    { path: 'sessions', label: 'Séances', icon: 'dumbbell' },
    { path: 'alerts', label: 'Alertes', icon: 'alert-circle' },
    { path: 'settings', label: 'Paramètres', icon: 'settings' },
  ];

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }
}
