import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  level: string;
  imageUrl: string | null;
  videoUrl?: string | null;
  status?: string;
  templateUrl?: string | null;
  skeletonUrl?: string | null;
  featuresUrl?: string | null;
  repsUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ExercisesService {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<Exercise[]>(`${environment.apiUrl}/exercises`);
  }
}
