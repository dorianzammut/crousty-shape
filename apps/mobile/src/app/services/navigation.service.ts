import { Injectable, signal, computed } from '@angular/core';

export interface ProgramRunStep {
  exerciseId: string;
  sets: number;
  reps: number;
  exercise: { id: string; name: string; category: string; level: string };
}

interface ProgramRun {
  programName: string;
  steps: ProgramRunStep[];
  currentIndex: number;
}

@Injectable({ providedIn: 'root' })
export class NavigationService {
  selectedExercise = signal<any>(null);
  private programRun = signal<ProgramRun | null>(null);

  readonly programRunStep = computed<ProgramRunStep | null>(() => {
    const run = this.programRun();
    return run ? run.steps[run.currentIndex] : null;
  });

  readonly programRunInfo = computed(() => {
    const run = this.programRun();
    if (!run) return null;
    return { name: run.programName, current: run.currentIndex + 1, total: run.steps.length };
  });

  setSelectedExercise(exercise: any): void {
    this.selectedExercise.set(exercise);
  }

  startProgramRun(programName: string, steps: ProgramRunStep[]): void {
    this.programRun.set({ programName, steps, currentIndex: 0 });
    this.selectedExercise.set(steps[0].exercise);
  }

  /** Advances to next exercise. Returns true if there is one, false if program is complete. */
  nextProgramExercise(): boolean {
    const run = this.programRun();
    if (!run) return false;
    const next = run.currentIndex + 1;
    if (next >= run.steps.length) return false;
    this.programRun.set({ ...run, currentIndex: next });
    this.selectedExercise.set(run.steps[next].exercise);
    return true;
  }

  isProgramRunActive(): boolean {
    return this.programRun() !== null;
  }

  endProgramRun(): void {
    this.programRun.set(null);
  }
}
