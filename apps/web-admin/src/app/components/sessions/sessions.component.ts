import { Component } from '@angular/core';

@Component({
  selector: 'app-sessions',
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-black uppercase italic tracking-tight">
        Séances <span class="text-yellow-400">Analysées</span>
      </h2>
      <div class="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
        <p class="text-zinc-500">45 021 séances analysées — données à connecter via l'API.</p>
      </div>
    </div>
  `
})
export class SessionsComponent {}
