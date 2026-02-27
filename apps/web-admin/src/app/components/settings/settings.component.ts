import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-black uppercase italic tracking-tight">
        <span class="text-yellow-400">Paramètres</span>
      </h2>
      <div class="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
        <p class="text-zinc-500">Configuration de la plateforme — à implémenter.</p>
      </div>
    </div>
  `
})
export class SettingsComponent {}
