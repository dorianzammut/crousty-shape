import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  selectedExercise = signal<any>(null);

  setSelectedExercise(exercise: any): void {
    this.selectedExercise.set(exercise);
  }
}
