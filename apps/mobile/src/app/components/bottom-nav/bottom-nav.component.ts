import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

interface NavTab {
  id: string;
  name: string;
  label: string;
}

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800 px-6 py-3 pb-8 z-50">
      <div class="max-w-md mx-auto flex justify-between items-center">
        @for (tab of tabs; track tab.id) {
          <a
            [routerLink]="tab.id === 'dashboard' ? '/' : '/' + tab.id"
            routerLinkActive="text-yellow-400"
            [routerLinkActiveOptions]="{ exact: tab.id === 'dashboard' }"
            class="flex flex-col items-center gap-1 transition-colors text-zinc-500 hover:text-zinc-300"
            #rla="routerLinkActive"
          >
            <div class="relative">
              <lucide-icon [name]="tab.name" [size]="24"></lucide-icon>
              @if (rla.isActive) {
                <div class="absolute -inset-2 bg-yellow-400/10 rounded-full -z-10 transition-all duration-300"></div>
              }
            </div>
            <span class="text-[10px] font-medium uppercase tracking-wider">{{ tab.label }}</span>
          </a>
        }
      </div>
    </nav>
  `
})
export class BottomNavComponent {
  tabs: NavTab[] = [
    { id: 'dashboard', name: 'layout-dashboard', label: 'Tableau' },
    { id: 'exercises', name: 'dumbbell', label: 'Exercices' },
    { id: 'programs', name: 'clipboard-list', label: 'Programmes' },
    { id: 'profile', name: 'user', label: 'Profil' },
  ];
}
