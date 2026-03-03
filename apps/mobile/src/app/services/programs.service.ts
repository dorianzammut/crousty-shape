import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Exercise } from './exercises.service';

export interface ProgramExercise {
  id: string;
  exerciseId: string;
  order: number;
  sets: number;
  reps: number;
  exercise: Pick<Exercise, 'id' | 'name' | 'category' | 'level'>;
}

export interface Program {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  exercises: ProgramExercise[];
}

@Injectable({ providedIn: 'root' })
export class ProgramsService {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<Program[]>(`${environment.apiUrl}/programs`);
  }

  create(name: string, description?: string) {
    return this.http.post<Program>(`${environment.apiUrl}/programs`, { name, description });
  }

  delete(id: string) {
    return this.http.delete(`${environment.apiUrl}/programs/${id}`);
  }

  addExercise(programId: string, exerciseId: string, sets = 3, reps = 10) {
    return this.http.post<ProgramExercise>(
      `${environment.apiUrl}/programs/${programId}/exercises`,
      { exerciseId, sets, reps },
    );
  }

  updateExercise(programId: string, exerciseId: string, sets: number, reps: number) {
    return this.http.patch<ProgramExercise>(
      `${environment.apiUrl}/programs/${programId}/exercises/${exerciseId}`,
      { sets, reps },
    );
  }

  removeExercise(programId: string, exerciseId: string) {
    return this.http.delete(`${environment.apiUrl}/programs/${programId}/exercises/${exerciseId}`);
  }
}
