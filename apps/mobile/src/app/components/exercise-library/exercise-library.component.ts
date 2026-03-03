import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NavigationService } from '../../services/navigation.service';
import { ExercisesService, Exercise } from '../../services/exercises.service';

@Component({
  selector: 'app-exercise-library',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './exercise-library.component.html'
})
export class ExerciseLibraryComponent implements OnInit {
  private router = inject(Router);
  private navService = inject(NavigationService);
  private exercisesService = inject(ExercisesService);

  search = signal('');
  activeFilter = signal('Tous');
  allExercises = signal<Exercise[]>([]);
  loading = signal(true);

  categories = ['Tous', 'Jambes', 'Pectoraux', 'Dos', 'Épaules', 'Bras'];

  filteredExercises = computed(() => {
    const s = this.search().toLowerCase();
    const f = this.activeFilter();
    return this.allExercises().filter(ex =>
      (f === 'Tous' || ex.category === f) &&
      ex.name.toLowerCase().includes(s)
    );
  });

  ngOnInit() {
    this.exercisesService.getAll().subscribe({
      next: exercises => {
        this.allExercises.set(exercises);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setFilter(cat: string): void { this.activeFilter.set(cat); }
  onSearchChange(value: string): void { this.search.set(value); }

  startWorkout(exercise: Exercise): void {
    this.navService.setSelectedExercise(exercise);
    this.router.navigate(['/workout']);
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
