import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NavigationService } from '../../services/navigation.service';
import { ExercisesService, Exercise } from '../../services/exercises.service';
import { FavoritesService } from '../../services/favorites.service';
import { EXERCISE_CATEGORIES } from '../../constants/exercise-categories';

@Component({
  selector: 'app-exercise-library',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './exercise-library.component.html'
})
export class ExerciseLibraryComponent implements OnInit {
  private router = inject(Router);
  private navService = inject(NavigationService);
  private exercisesService = inject(ExercisesService);
  private favoritesService = inject(FavoritesService);

  search = signal('');
  activeFilter = signal('Tous');
  allExercises = signal<Exercise[]>([]);
  favoriteIds = signal<Set<string>>(new Set());
  loading = signal(true);
  togglingId = signal<string | null>(null);

  categories = EXERCISE_CATEGORIES;

  filteredExercises = computed(() => {
    const s = this.search().toLowerCase();
    const f = this.activeFilter();
    const favIds = this.favoriteIds();

    return this.allExercises().filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(s);
      if (f === 'Favoris') return favIds.has(ex.id) && matchesSearch;
      if (f === 'Tous') return matchesSearch;
      return ex.category === f && matchesSearch;
    });
  });

  ngOnInit() {
    this.exercisesService.getAll().subscribe({
      next: exercises => {
        this.allExercises.set(exercises);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.favoritesService.getAll().subscribe({
      next: favs => this.favoriteIds.set(new Set(favs.map(f => f.exerciseId))),
    });
  }

  setFilter(cat: string): void { this.activeFilter.set(cat); }
  onSearchChange(value: string): void { this.search.set(value); }

  toggleFavorite(id: string): void {
    this.togglingId.set(id);
    this.favoritesService.toggle(id).subscribe({
      next: ({ favorited }) => {
        this.favoriteIds.update(set => {
          const next = new Set(set);
          if (favorited) { next.add(id); } else { next.delete(id); }
          return next;
        });
        this.togglingId.set(null);
      },
      error: () => this.togglingId.set(null),
    });
  }

  isFavorite(id: string): boolean { return this.favoriteIds().has(id); }

  startWorkout(exercise: Exercise): void {
    this.navService.setSelectedExercise(exercise);
    this.router.navigate(['/workout']);
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
