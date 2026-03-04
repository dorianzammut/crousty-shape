import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface CategoryCount {
  label: string;
  count: number;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  level: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  status?: string;
  skeletonUrl?: string;
  featuresUrl?: string;
  repsUrl?: string;
  templateUrl?: string;
  createdById?: string;
  createdBy?: { id: string; name: string };
}

@Injectable({ providedIn: 'root' })
export class ExercisesService {
  private http = inject(HttpClient);

  getCategories() {
    return this.http.get<CategoryCount[]>(`${environment.apiUrl}/exercises/categories`);
  }

  getAll() {
    return this.http.get<Exercise[]>(`${environment.apiUrl}/exercises`);
  }

  getMine() {
    return this.http.get<Exercise[]>(`${environment.apiUrl}/exercises/mine`);
  }

  create(dto: { name: string; category: string; level: string; description?: string; imageUrl?: string; videoUrl?: string }) {
    return this.http.post<Exercise>(`${environment.apiUrl}/exercises`, dto);
  }

  update(id: string, dto: Partial<{ name: string; category: string; level: string; description: string; imageUrl: string; videoUrl: string }>) {
    return this.http.patch<Exercise>(`${environment.apiUrl}/exercises/${id}`, dto);
  }

  getSkeleton(id: string) {
    return this.http.get<any>(`${environment.apiUrl}/exercises/${id}/skeleton`);
  }

  delete(id: string) {
    return this.http.delete<{ deleted: boolean }>(`${environment.apiUrl}/exercises/${id}`);
  }

  uploadFile(file: File, type: 'image' | 'video') {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${environment.apiUrl}/upload?type=${type}`, formData);
  }
}
