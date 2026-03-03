import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Exercise } from './exercises.service';

export interface FavoriteItem {
  id: string;
  exerciseId: string;
  exercise: Exercise;
}

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<FavoriteItem[]>(`${environment.apiUrl}/favorites`);
  }

  toggle(exerciseId: string) {
    return this.http.post<{ favorited: boolean }>(`${environment.apiUrl}/favorites/${exerciseId}`, {});
  }
}
