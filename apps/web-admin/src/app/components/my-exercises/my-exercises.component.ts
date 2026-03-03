import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { ExercisesService, Exercise } from '../../services/exercises.service';
import { EXERCISE_CATEGORIES, getCategoryLabel } from '../../constants/exercise-categories';

@Component({
  selector: 'app-my-exercises',
  imports: [LucideAngularModule, FormsModule],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-black uppercase italic tracking-tight">
        Mes <span class="text-yellow-400">Exercices</span>
      </h2>

      <div class="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <div class="p-6 border-b border-zinc-800 flex justify-between items-center">
          @if (loading()) {
            <span class="font-bold text-zinc-500">Chargement...</span>
          } @else {
            <span class="font-bold">{{ filteredExercises().length }} exercice(s)</span>
          }
          <button
            (click)="openCreateModal()"
            class="flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-yellow-300 transition-colors">
            <lucide-icon name="plus" [size]="16"></lucide-icon>
            Ajouter un exercice
          </button>
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
                <div class="flex items-center gap-2 mt-1">
                  <span class="bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{{ categoryLabel(ex.category) }}</span>
                  <span class="bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{{ ex.level }}</span>
                </div>
              </div>
              <button
                (click)="openDeleteModal(ex); $event.stopPropagation()"
                class="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors">
                <lucide-icon name="trash-2" [size]="14"></lucide-icon>
                Supprimer
              </button>
            </div>
          }
          @if (!loading() && filteredExercises().length === 0) {
            <div class="col-span-full text-center py-10 text-zinc-500">
              @if (exercises().length === 0) {
                Aucun exercice créé. Cliquez sur "Ajouter un exercice" pour commencer.
              } @else {
                Aucun exercice ne correspond à votre recherche.
              }
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    @if (showCreateModal()) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="closeModals()">
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-black uppercase italic">
              Nouvel <span class="text-yellow-400">Exercice</span>
            </h3>
            <button (click)="closeModals()" class="text-zinc-500 hover:text-white transition-colors">
              <lucide-icon name="x" [size]="20"></lucide-icon>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nom</label>
              <input
                [(ngModel)]="form.name"
                type="text"
                placeholder="Pompes classiques"
                class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400" />
            </div>
            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Catégorie</label>
              <select
                [(ngModel)]="form.category"
                class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400">
                <option value="" disabled>Choisir une catégorie</option>
                @for (cat of categories; track cat.value) {
                  <option [value]="cat.value">{{ cat.label }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Niveau</label>
              <div class="flex gap-3">
                @for (lvl of levels; track lvl) {
                  <button
                    (click)="form.level = lvl"
                    [class]="form.level === lvl
                      ? 'flex-1 py-2.5 rounded-lg text-sm font-bold border-2 border-yellow-400 bg-yellow-400/10 text-yellow-400'
                      : 'flex-1 py-2.5 rounded-lg text-sm font-bold border-2 border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'">
                    {{ lvl }}
                  </button>
                }
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Description (optionnel)</label>
              <textarea
                [(ngModel)]="form.description"
                rows="3"
                placeholder="Décrivez l'exercice..."
                class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 resize-none"></textarea>
            </div>
            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Image (optionnel)</label>
              <div class="space-y-2">
                @if (imagePreviewUrl()) {
                  <img [src]="imagePreviewUrl()" alt="Aperçu" class="w-full h-36 object-cover rounded-lg" />
                }
                <label class="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm cursor-pointer hover:border-zinc-600 transition-colors">
                  <lucide-icon name="upload" [size]="16" class="text-zinc-400"></lucide-icon>
                  <span class="text-zinc-400">{{ imageFile() ? imageFile()!.name : 'Choisir une image' }}</span>
                  <input type="file" accept="image/*" class="hidden" (change)="onImageSelected($event)" />
                </label>
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Vidéo de démo (optionnel)</label>
              <label class="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm cursor-pointer hover:border-zinc-600 transition-colors">
                <lucide-icon name="video" [size]="16" class="text-zinc-400"></lucide-icon>
                <span class="text-zinc-400">{{ videoFile() ? videoFile()!.name : 'Choisir une vidéo' }}</span>
                <input type="file" accept="video/*" class="hidden" (change)="onVideoSelected($event)" />
              </label>
            </div>
          </div>

          @if (error()) {
            <p class="text-red-400 text-sm">{{ error() }}</p>
          }

          <div class="flex gap-3 pt-2">
            <button (click)="closeModals()" class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
              Annuler
            </button>
            <button
              (click)="submitCreate()"
              [disabled]="submitting()"
              class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-yellow-400 text-black hover:bg-yellow-300 transition-colors disabled:opacity-50">
              {{ uploading() ? 'Upload en cours...' : submitting() ? 'Création...' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Detail / Edit Modal -->
    @if (showDetailModal()) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="closeModals()">
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-black uppercase italic">
              Détail <span class="text-yellow-400">Exercice</span>
            </h3>
            <button (click)="closeModals()" class="text-zinc-500 hover:text-white transition-colors">
              <lucide-icon name="x" [size]="20"></lucide-icon>
            </button>
          </div>

          @if (!editing()) {
            <!-- Read mode -->
            @if (selectedExercise()?.imageUrl) {
              <img [src]="selectedExercise()!.imageUrl" [alt]="selectedExercise()!.name" class="w-full h-48 object-cover rounded-lg" />
            }
            @if (selectedExercise()?.videoUrl) {
              <video [src]="selectedExercise()!.videoUrl" controls class="w-full rounded-lg"></video>
            }
            <div class="space-y-3">
              <h4 class="text-xl font-bold">{{ selectedExercise()?.name }}</h4>
              <div class="flex items-center gap-2">
                <span class="bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded text-xs font-bold uppercase">{{ categoryLabel(selectedExercise()?.category ?? '') }}</span>
                <span class="bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded text-xs font-bold uppercase">{{ selectedExercise()?.level }}</span>
              </div>
              @if (selectedExercise()?.description) {
                <p class="text-sm text-zinc-400">{{ selectedExercise()!.description }}</p>
              }
              @if (selectedExercise()?.createdBy) {
                <p class="text-xs text-zinc-500">Par <span class="text-zinc-400">{{ selectedExercise()!.createdBy!.name }}</span></p>
              }
            </div>
            <div class="flex gap-3 pt-2">
              <button (click)="closeModals()" class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
                Fermer
              </button>
              <button (click)="startEditing()" class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-yellow-400 text-black hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2">
                <lucide-icon name="edit" [size]="16"></lucide-icon>
                Modifier
              </button>
            </div>
          } @else {
            <!-- Edit mode -->
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nom</label>
                <input
                  [(ngModel)]="editForm.name"
                  type="text"
                  class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400" />
              </div>
              <div>
                <label class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Catégorie</label>
                <select
                  [(ngModel)]="editForm.category"
                  class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400">
                  @for (cat of categories; track cat.value) {
                    <option [value]="cat.value">{{ cat.label }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Niveau</label>
                <div class="flex gap-3">
                  @for (lvl of levels; track lvl) {
                    <button
                      (click)="editForm.level = lvl"
                      [class]="editForm.level === lvl
                        ? 'flex-1 py-2.5 rounded-lg text-sm font-bold border-2 border-yellow-400 bg-yellow-400/10 text-yellow-400'
                        : 'flex-1 py-2.5 rounded-lg text-sm font-bold border-2 border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'">
                      {{ lvl }}
                    </button>
                  }
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  [(ngModel)]="editForm.description"
                  rows="3"
                  class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 resize-none"></textarea>
              </div>
              <div>
                <label class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Image</label>
                <div class="space-y-2">
                  @if (editImagePreviewUrl()) {
                    <img [src]="editImagePreviewUrl()" alt="Aperçu" class="w-full h-36 object-cover rounded-lg" />
                  }
                  <label class="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm cursor-pointer hover:border-zinc-600 transition-colors">
                    <lucide-icon name="upload" [size]="16" class="text-zinc-400"></lucide-icon>
                    <span class="text-zinc-400">{{ editImageFile() ? editImageFile()!.name : 'Changer l\\'image' }}</span>
                    <input type="file" accept="image/*" class="hidden" (change)="onEditImageSelected($event)" />
                  </label>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Vidéo de démo</label>
                <label class="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm cursor-pointer hover:border-zinc-600 transition-colors">
                  <lucide-icon name="video" [size]="16" class="text-zinc-400"></lucide-icon>
                  <span class="text-zinc-400">{{ editVideoFile() ? editVideoFile()!.name : 'Changer la vidéo' }}</span>
                  <input type="file" accept="video/*" class="hidden" (change)="onEditVideoSelected($event)" />
                </label>
              </div>
            </div>

            @if (error()) {
              <p class="text-red-400 text-sm">{{ error() }}</p>
            }

            <div class="flex gap-3 pt-2">
              <button (click)="cancelEditing()" class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
                Annuler
              </button>
              <button
                (click)="submitEdit()"
                [disabled]="submitting()"
                class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-yellow-400 text-black hover:bg-yellow-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <lucide-icon name="save" [size]="16"></lucide-icon>
                {{ uploading() ? 'Upload...' : submitting() ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          }
        </div>
      </div>
    }

    <!-- Delete Confirmation Modal -->
    @if (showDeleteModal()) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" (click)="closeModals()">
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm mx-4 p-6 space-y-5" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-black uppercase italic">
              Supprimer <span class="text-red-400">Exercice</span>
            </h3>
            <button (click)="closeModals()" class="text-zinc-500 hover:text-white transition-colors">
              <lucide-icon name="x" [size]="20"></lucide-icon>
            </button>
          </div>

          <p class="text-sm text-zinc-400">
            Supprimer l'exercice
            <span class="text-white font-bold">{{ exerciseToDelete()?.name }}</span> ?
            Cette action est irréversible.
          </p>

          @if (error()) {
            <p class="text-red-400 text-sm">{{ error() }}</p>
          }

          <div class="flex gap-3 pt-2">
            <button (click)="closeModals()" class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
              Annuler
            </button>
            <button
              (click)="confirmDelete()"
              [disabled]="submitting()"
              class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-400 transition-colors disabled:opacity-50">
              {{ submitting() ? 'Suppression...' : 'Supprimer' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class MyExercisesComponent implements OnInit {
  private exercisesService = inject(ExercisesService);

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
  showCreateModal = signal(false);
  showDeleteModal = signal(false);
  showDetailModal = signal(false);
  selectedExercise = signal<Exercise | null>(null);
  editing = signal(false);
  editImageFile = signal<File | null>(null);
  editVideoFile = signal<File | null>(null);
  editImagePreviewUrl = signal<string | null>(null);
  submitting = signal(false);
  uploading = signal(false);
  error = signal('');
  exerciseToDelete = signal<Exercise | null>(null);

  imageFile = signal<File | null>(null);
  videoFile = signal<File | null>(null);
  imagePreviewUrl = signal<string | null>(null);

  categories = EXERCISE_CATEGORIES;
  levels = ['Débutant', 'Intermédiaire', 'Avancé'];
  form = { name: '', category: '', level: 'Débutant', description: '' };
  editForm = { name: '', category: '', level: '', description: '' };

  categoryLabel = getCategoryLabel;

  ngOnInit() {
    this.loadExercises();
  }

  openCreateModal() {
    this.form = { name: '', category: '', level: 'Débutant', description: '' };
    this.imageFile.set(null);
    this.videoFile.set(null);
    this.imagePreviewUrl.set(null);
    this.error.set('');
    this.showCreateModal.set(true);
  }

  openDeleteModal(ex: Exercise) {
    this.exerciseToDelete.set(ex);
    this.error.set('');
    this.showDeleteModal.set(true);
  }

  openDetailModal(ex: Exercise) {
    this.selectedExercise.set(ex);
    this.editing.set(false);
    this.error.set('');
    this.showDetailModal.set(true);
  }

  startEditing() {
    const ex = this.selectedExercise();
    if (!ex) return;
    this.editForm = {
      name: ex.name,
      category: ex.category,
      level: ex.level,
      description: ex.description ?? '',
    };
    this.editImageFile.set(null);
    this.editVideoFile.set(null);
    this.editImagePreviewUrl.set(ex.imageUrl ?? null);
    this.error.set('');
    this.editing.set(true);
  }

  cancelEditing() {
    this.editing.set(false);
    this.error.set('');
  }

  onEditImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.editImageFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.editImagePreviewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onEditVideoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.editVideoFile.set(file);
  }

  async submitEdit() {
    const ex = this.selectedExercise();
    if (!ex) return;
    if (!this.editForm.name || !this.editForm.category || !this.editForm.level) {
      this.error.set('Nom, catégorie et niveau sont requis.');
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    try {
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;

      if (this.editImageFile() || this.editVideoFile()) {
        this.uploading.set(true);
        if (this.editImageFile()) {
          const res = await firstValueFrom(this.exercisesService.uploadFile(this.editImageFile()!, 'image'));
          imageUrl = res.url;
        }
        if (this.editVideoFile()) {
          const res = await firstValueFrom(this.exercisesService.uploadFile(this.editVideoFile()!, 'video'));
          videoUrl = res.url;
        }
        this.uploading.set(false);
      }

      const dto: any = {
        name: this.editForm.name,
        category: this.editForm.category,
        level: this.editForm.level,
        description: this.editForm.description || undefined,
      };
      if (imageUrl) dto.imageUrl = imageUrl;
      if (videoUrl) dto.videoUrl = videoUrl;

      const updated = await firstValueFrom(this.exercisesService.update(ex.id, dto));
      this.exercises.update(list => list.map(e => e.id === ex.id ? updated : e));
      this.selectedExercise.set(updated);
      this.editing.set(false);
      this.submitting.set(false);
    } catch (err: any) {
      this.uploading.set(false);
      this.error.set(err.error?.message || 'Erreur lors de la mise à jour.');
      this.submitting.set(false);
    }
  }

  closeModals() {
    this.showCreateModal.set(false);
    this.showDeleteModal.set(false);
    this.showDetailModal.set(false);
    this.selectedExercise.set(null);
    this.editing.set(false);
    this.exerciseToDelete.set(null);
  }

  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.imageFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.imagePreviewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onVideoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.videoFile.set(file);
  }

  async submitCreate() {
    if (!this.form.name || !this.form.category || !this.form.level) {
      this.error.set('Nom, catégorie et niveau sont requis.');
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    try {
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;

      // Upload files first
      if (this.imageFile() || this.videoFile()) {
        this.uploading.set(true);
        if (this.imageFile()) {
          const res = await firstValueFrom(this.exercisesService.uploadFile(this.imageFile()!, 'image'));
          imageUrl = res.url;
        }
        if (this.videoFile()) {
          const res = await firstValueFrom(this.exercisesService.uploadFile(this.videoFile()!, 'video'));
          videoUrl = res.url;
        }
        this.uploading.set(false);
      }

      const dto: any = {
        name: this.form.name,
        category: this.form.category,
        level: this.form.level,
      };
      if (this.form.description) dto.description = this.form.description;
      if (imageUrl) dto.imageUrl = imageUrl;
      if (videoUrl) dto.videoUrl = videoUrl;

      const ex = await firstValueFrom(this.exercisesService.create(dto));
      this.exercises.update(list => [ex, ...list]);
      this.submitting.set(false);
      this.closeModals();
    } catch (err: any) {
      this.uploading.set(false);
      this.error.set(err.error?.message || 'Erreur lors de la création.');
      this.submitting.set(false);
    }
  }

  confirmDelete() {
    const ex = this.exerciseToDelete();
    if (!ex) return;

    this.submitting.set(true);
    this.error.set('');

    this.exercisesService.delete(ex.id).subscribe({
      next: () => {
        this.exercises.update(list => list.filter(e => e.id !== ex.id));
        this.submitting.set(false);
        this.closeModals();
      },
      error: err => {
        this.error.set(err.error?.message || 'Erreur lors de la suppression.');
        this.submitting.set(false);
      },
    });
  }

  private loadExercises() {
    this.exercisesService.getMine().subscribe({
      next: exercises => {
        this.exercises.set(exercises);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
