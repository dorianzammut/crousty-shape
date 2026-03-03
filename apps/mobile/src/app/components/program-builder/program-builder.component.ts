import { Component, signal, inject, OnInit } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ProgramsService, Program } from '../../services/programs.service';

@Component({
  selector: 'app-program-builder',
  imports: [LucideAngularModule],
  templateUrl: './program-builder.component.html'
})
export class ProgramBuilderComponent implements OnInit {
  private programsService = inject(ProgramsService);

  coachPrograms = signal<Program[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.programsService.getAll().subscribe({
      next: programs => {
        this.coachPrograms.set(programs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
