import { Component, signal, computed, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ExercisesService, Exercise } from '../../services/exercises.service';
import { AuthService } from '../../services/auth.service';
import { EXERCISE_CATEGORIES, getCategoryLabel } from '../../constants/exercise-categories';
import { SkeletonPlayerComponent } from '../skeleton-player/skeleton-player.component';

@Component({
  selector: 'app-catalogue',
  imports: [LucideAngularModule, FormsModule, SkeletonPlayerComponent],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-black uppercase italic tracking-tight">
        <span class="text-yellow-400">Catalogue</span> des Exercices
      </h2>

      <div class="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <div class="p-6 border-b border-zinc-800">
          @if (loading()) {
            <span class="font-bold text-zinc-500">Chargement...</span>
          } @else {
            <span class="font-bold">{{ filteredExercises().length }} exercice(s) disponible(s)</span>
          }
        </div>

        <div class="p-6 pb-0 flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <lucide-icon name="search" [size]="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"></lucide-icon>
            <input
              type="text"
              placeholder="Rechercher par nom..."
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              class="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400" />
          </div>
          <select
            [ngModel]="filterCategory()"
            (ngModelChange)="filterCategory.set($event)"
            class="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 sm:w-52">
            <option value="">Toutes les catégories</option>
            @for (cat of categories; track cat.value) {
              <option [value]="cat.value">{{ cat.label }}</option>
            }
          </select>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          @for (ex of filteredExercises(); track ex.id) {
            <div (click)="openDetailModal(ex)" class="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 space-y-3 cursor-pointer hover:border-zinc-600 transition-colors">
              @if (ex.imageUrl) {
                <div class="relative">
                  <img [src]="ex.imageUrl" [alt]="ex.name" class="w-full h-36 object-cover rounded-lg" />
                  @if (ex.videoUrl) {
                    <div class="absolute top-2 right-2 bg-black/70 rounded-full p-1.5">
                      <lucide-icon name="video" [size]="14" class="text-yellow-400"></lucide-icon>
                    </div>
                  }
                </div>
              } @else {
                <div class="w-full h-36 bg-zinc-700/30 rounded-lg flex items-center justify-center relative">
                  <lucide-icon name="dumbbell" [size]="32" class="text-zinc-600"></lucide-icon>
                  @if (ex.videoUrl) {
                    <div class="absolute top-2 right-2 bg-black/70 rounded-full p-1.5">
                      <lucide-icon name="video" [size]="14" class="text-yellow-400"></lucide-icon>
                    </div>
                  }
                </div>
              }
              <div>
                <h3 class="font-bold text-sm">{{ ex.name }}</h3>
                @if (ex.description) {
                  <p class="text-xs text-zinc-400 mt-1 line-clamp-2">{{ ex.description }}</p>
                }
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                  <span class="bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{{ categoryLabel(ex.category) }}</span>
                  <span class="bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{{ ex.level }}</span>
                  @if (ex.status === 'PROCESSING') {
                    <span class="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase animate-pulse">Analyse en cours...</span>
                  } @else if (ex.status === 'READY') {
                    <span class="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Prêt</span>
                  } @else if (ex.status === 'FAILED') {
                    <span class="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Erreur</span>
                  }
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  @if (ex.createdBy) {
                    <p class="text-[11px] text-zinc-500">
                      Par <span class="text-zinc-400">{{ ex.createdBy.name }}</span>
                    </p>
                  }
                  @if (ex.videoUrl) {
                    <span class="flex items-center gap-1 text-[11px] text-yellow-400">
                      <lucide-icon name="video" [size]="12"></lucide-icon>
                      Vidéo dispo
                    </span>
                  }
                </div>
                @if (isAdmin()) {
                  <button
                    (click)="openDeleteModal(ex); $event.stopPropagation()"
                    class="text-zinc-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-400/10"
                    title="Supprimer cet exercice">
                    <lucide-icon name="trash-2" [size]="16"></lucide-icon>
                  </button>
                }
              </div>
            </div>
          }
          @if (!loading() && filteredExercises().length === 0) {
            <div class="col-span-full text-center py-10 text-zinc-500">
              @if (exercises().length === 0) {
                Aucun exercice disponible.
              } @else {
                Aucun exercice ne correspond à votre recherche.
              }
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Detail Modal (read-only) -->
    @if (showDetailModal()) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="closeDetailModal()">
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-black uppercase italic">
              Détail <span class="text-yellow-400">Exercice</span>
            </h3>
            <button (click)="closeDetailModal()" class="text-zinc-500 hover:text-white transition-colors">
              <lucide-icon name="x" [size]="20"></lucide-icon>
            </button>
          </div>

          @if (selectedExercise()?.imageUrl) {
            <img [src]="selectedExercise()!.imageUrl" [alt]="selectedExercise()!.name" class="w-full h-48 object-cover rounded-lg" />
          }
          @if (selectedExercise()?.videoUrl) {
            <app-skeleton-player
              [videoUrl]="selectedExercise()!.videoUrl!"
              [exerciseId]="selectedExercise()!.id"
              [hasSkeletonUrl]="!!selectedExercise()!.skeletonUrl"
            />
          }

          <div class="space-y-3">
            <h4 class="text-xl font-bold">{{ selectedExercise()?.name }}</h4>
            <div class="flex items-center gap-2">
              <span class="bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded text-xs font-bold uppercase">{{ categoryLabel(selectedExercise()?.category ?? '') }}</span>
              <span class="bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded text-xs font-bold uppercase">{{ selectedExercise()?.level }}</span>
            </div>
            @if (selectedExercise()?.status === 'READY') {
              <div class="flex items-center gap-2 flex-wrap">
                @if (selectedExercise()?.templateUrl) {
                  <span class="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold uppercase">Template prêt</span>
                }
                @if (selectedExercise()?.repsUrl) {
                  <span class="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-bold uppercase">Reps analysées</span>
                }
              </div>
            }
            @if (selectedExercise()?.description) {
              <p class="text-sm text-zinc-400">{{ selectedExercise()!.description }}</p>
            }
            @if (selectedExercise()?.createdBy) {
              <p class="text-xs text-zinc-500">Par <span class="text-zinc-400">{{ selectedExercise()!.createdBy!.name }}</span></p>
            }
          </div>

          <div class="pt-2 flex gap-3">
            @if (isAdmin()) {
              <button (click)="openDeleteModal(selectedExercise()!); closeDetailModal()" class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
                <lucide-icon name="trash-2" [size]="16"></lucide-icon>
                Supprimer
              </button>
            }
            <button (click)="closeDetailModal()" class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
              Fermer
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Delete Confirmation Modal -->
    @if (showDeleteModal()) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="closeDeleteModal()">
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm mx-4 p-6 space-y-4" (click)="$event.stopPropagation()">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <lucide-icon name="triangle-alert" [size]="20" class="text-red-400"></lucide-icon>
            </div>
            <h3 class="text-lg font-bold">Supprimer l'exercice</h3>
          </div>
          <p class="text-sm text-zinc-400">
            Êtes-vous sûr de vouloir supprimer <span class="text-white font-semibold">{{ exerciseToDelete()?.name }}</span> ? Cette action est irréversible.
          </p>
          @if (deleteError()) {
            <p class="text-sm text-red-400">{{ deleteError() }}</p>
          }
          <div class="flex gap-3">
            <button (click)="closeDeleteModal()" class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
              Annuler
            </button>
            <button
              (click)="confirmDelete()"
              [disabled]="deleting()"
              style="color: white"
              class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50">
              {{ deleting() ? 'Suppression...' : 'Supprimer' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class CatalogueComponent implements OnInit {
  private exercisesService = inject(ExercisesService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  exercises = signal<Exercise[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  filterCategory = signal('');
  filteredExercises = computed(() => {
    let list = this.exercises();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(ex => ex.name.toLowerCase().includes(q));
    const cat = this.filterCategory();
    if (cat) list = list.filter(ex => ex.category === cat);
    return list;
  });
  showDetailModal = signal(false);
  selectedExercise = signal<Exercise | null>(null);

  // Delete state
  showDeleteModal = signal(false);
  exerciseToDelete = signal<Exercise | null>(null);
  deleting = signal(false);
  deleteError = signal('');

  categories = EXERCISE_CATEGORIES;
  categoryLabel = getCategoryLabel;

  isAdmin = computed(() => this.authService.currentUser()?.role === 'ADMIN');

  openDetailModal(ex: Exercise) {
    this.selectedExercise.set(ex);
    this.showDetailModal.set(true);
  }

  closeDetailModal() {
    this.showDetailModal.set(false);
    this.selectedExercise.set(null);
  }

  openDeleteModal(ex: Exercise) {
    this.exerciseToDelete.set(ex);
    this.deleteError.set('');
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.exerciseToDelete.set(null);
    this.deleteError.set('');
  }

  confirmDelete() {
    const ex = this.exerciseToDelete();
    if (!ex) return;
    this.deleting.set(true);
    this.deleteError.set('');
    this.exercisesService.delete(ex.id).subscribe({
      next: () => {
        this.exercises.update(list => list.filter(e => e.id !== ex.id));
        this.deleting.set(false);
        this.closeDeleteModal();
      },
      error: () => {
        this.deleteError.set('Erreur lors de la suppression. Veuillez réessayer.');
        this.deleting.set(false);
      },
    });
  }

  ngOnInit() {
    this.exercisesService.getAll().subscribe({
      next: exercises => {
        this.exercises.set(exercises);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      },
    });
  }
}
