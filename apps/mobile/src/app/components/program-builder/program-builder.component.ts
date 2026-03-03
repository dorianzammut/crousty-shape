import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ProgramsService, Program, ProgramExercise } from '../../services/programs.service';
import { ExercisesService, Exercise } from '../../services/exercises.service';
import { NavigationService } from '../../services/navigation.service';

type View = 'list' | 'detail' | 'pick-exercise';

@Component({
  selector: 'app-program-builder',
  imports: [LucideAngularModule],
  templateUrl: './program-builder.component.html'
})
export class ProgramBuilderComponent implements OnInit {
  private programsService = inject(ProgramsService);
  private exercisesService = inject(ExercisesService);
  private navService = inject(NavigationService);
  private router = inject(Router);

  // ── State ──────────────────────────────────────────────────────────────────
  view = signal<View>('list');
  programs = signal<Program[]>([]);
  selectedProgram = signal<Program | null>(null);
  loading = signal(true);
  showCreateForm = signal(false);
  saving = signal(false);
  newProgramName = '';

  allExercises = signal<Exercise[]>([]);
  exerciseSearch = signal('');

  filteredExercises = computed(() => {
    const s = this.exerciseSearch().toLowerCase();
    const prog = this.selectedProgram();
    const existingIds = new Set(prog?.exercises.map(e => e.exerciseId) ?? []);
    return this.allExercises().filter(ex =>
      !existingIds.has(ex.id) &&
      (ex.name.toLowerCase().includes(s) || ex.category.toLowerCase().includes(s))
    );
  });

  editingExerciseId = signal<string | null>(null);
  editSets = 3;
  editReps = 10;

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    this.loadPrograms();
    this.exercisesService.getAll().subscribe(exs => this.allExercises.set(exs));
  }

  private loadPrograms() {
    this.loading.set(true);
    this.programsService.getAll().subscribe({
      next: programs => { this.programs.set(programs); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  // ── Create program ─────────────────────────────────────────────────────────
  openCreate() { this.showCreateForm.set(true); this.newProgramName = ''; }
  cancelCreate() { this.showCreateForm.set(false); }

  createProgram() {
    const name = this.newProgramName.trim();
    if (!name) return;
    this.saving.set(true);
    this.programsService.create(name).subscribe({
      next: prog => {
        this.programs.update(ps => [prog, ...ps]);
        this.showCreateForm.set(false);
        this.saving.set(false);
        this.selectProgram(prog);
      },
      error: () => this.saving.set(false),
    });
  }

  // ── Navigate ───────────────────────────────────────────────────────────────
  selectProgram(prog: Program) {
    this.selectedProgram.set(prog);
    this.editingExerciseId.set(null);
    this.view.set('detail');
  }

  backToList() { this.view.set('list'); this.selectedProgram.set(null); }

  openExercisePicker() { this.exerciseSearch.set(''); this.view.set('pick-exercise'); }

  backToDetail() { this.view.set('detail'); }

  // ── Delete program ─────────────────────────────────────────────────────────
  deleteProgram(prog: Program) {
    this.programsService.delete(prog.id).subscribe(() => {
      this.programs.update(ps => ps.filter(p => p.id !== prog.id));
    });
  }

  // ── Add / remove exercise ──────────────────────────────────────────────────
  addExercise(exercise: Exercise) {
    const prog = this.selectedProgram();
    if (!prog) return;
    this.programsService.addExercise(prog.id, exercise.id).subscribe({
      next: pe => {
        const updated = { ...prog, exercises: [...prog.exercises, pe] };
        this.selectedProgram.set(updated);
        this.programs.update(ps => ps.map(p => p.id === prog.id ? updated : p));
        this.view.set('detail');
      },
    });
  }

  removeExercise(exerciseId: string) {
    const prog = this.selectedProgram();
    if (!prog) return;
    this.programsService.removeExercise(prog.id, exerciseId).subscribe(() => {
      const updated = { ...prog, exercises: prog.exercises.filter(e => e.exerciseId !== exerciseId) };
      this.selectedProgram.set(updated);
      this.programs.update(ps => ps.map(p => p.id === prog.id ? updated : p));
    });
  }

  // ── Edit sets / reps ───────────────────────────────────────────────────────
  startEdit(pe: ProgramExercise) {
    this.editingExerciseId.set(pe.exerciseId);
    this.editSets = pe.sets;
    this.editReps = pe.reps;
  }

  cancelEdit() { this.editingExerciseId.set(null); }

  saveEdit(exerciseId: string) {
    const prog = this.selectedProgram();
    if (!prog) return;
    this.programsService.updateExercise(prog.id, exerciseId, this.editSets, this.editReps).subscribe({
      next: pe => {
        const updated = {
          ...prog,
          exercises: prog.exercises.map(e => e.exerciseId === exerciseId ? { ...e, sets: pe.sets, reps: pe.reps } : e),
        };
        this.selectedProgram.set(updated);
        this.programs.update(ps => ps.map(p => p.id === prog.id ? updated : p));
        this.editingExerciseId.set(null);
      },
    });
  }

  setEditSets(v: string) { this.editSets = Math.max(1, parseInt(v) || 1); }
  setEditReps(v: string) { this.editReps = Math.max(1, parseInt(v) || 1); }

  // ── Launch program ─────────────────────────────────────────────────────────
  launchProgram() {
    const prog = this.selectedProgram();
    if (!prog || prog.exercises.length === 0) return;
    this.navService.startProgramRun(prog.name, prog.exercises.map(pe => ({
      exerciseId: pe.exerciseId,
      sets: pe.sets,
      reps: pe.reps,
      exercise: pe.exercise,
    })));
    this.router.navigate(['/workout']);
  }

  // ── Misc ───────────────────────────────────────────────────────────────────
  setSearch(value: string) { this.exerciseSearch.set(value); }
  setName(value: string) { this.newProgramName = value; }
}
