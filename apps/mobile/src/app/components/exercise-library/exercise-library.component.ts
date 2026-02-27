import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NavigationService } from '../../services/navigation.service';

interface Exercise {
  id: number;
  name: string;
  category: string;
  level: string;
  image: string;
}

@Component({
  selector: 'app-exercise-library',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './exercise-library.component.html'
})
export class ExerciseLibraryComponent {
  private navService = new NavigationService();

  constructor(private router: Router) {}

  search = signal('');
  activeFilter = signal('Tous');

  categories = ['Tous', 'Jambes', 'Pectoraux', 'Dos', 'Épaules', 'Bras'];

  exercises: Exercise[] = [
    { id: 1, name: 'Squat Gobelet', category: 'Jambes', level: 'Débutant', image: 'https://images.unsplash.com/photo-1645810809381-97f6fd2f7d10?w=600&auto=format&fit=crop' },
    { id: 2, name: 'Pompes Classiques', category: 'Pectoraux', level: 'Intermédiaire', image: 'https://images.unsplash.com/photo-1525565004407-a1f6f55b5dd6?w=600&auto=format&fit=crop' },
    { id: 3, name: 'Soulevé de Terre', category: 'Dos', level: 'Avancé', image: 'https://images.unsplash.com/photo-1758875569256-f37c438cac65?w=600&auto=format&fit=crop' },
    { id: 4, name: 'Développé Couché', category: 'Pectoraux', level: 'Intermédiaire', image: 'https://images.unsplash.com/photo-1651346847980-ab1c883e8cc8?w=600&auto=format&fit=crop' },
    { id: 5, name: 'Fentes Marchées', category: 'Jambes', level: 'Débutant', image: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=600&auto=format&fit=crop' },
    { id: 6, name: 'Tractions', category: 'Dos', level: 'Avancé', image: 'https://images.unsplash.com/photo-1598971639058-aba3c391c0a6?w=600&auto=format&fit=crop' },
  ];

  filteredExercises = computed(() => {
    const s = this.search().toLowerCase();
    const f = this.activeFilter();
    return this.exercises.filter(ex =>
      (f === 'Tous' || ex.category === f) &&
      ex.name.toLowerCase().includes(s)
    );
  });

  setFilter(cat: string): void {
    this.activeFilter.set(cat);
  }

  onSearchChange(value: string): void {
    this.search.set(value);
  }

  startWorkout(exercise: Exercise): void {
    this.navService.setSelectedExercise(exercise);
    this.router.navigate(['/workout']);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
