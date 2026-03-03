import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AdminSession {
  id: string;
  reps: number;
  qualityScore: number;
  duration: number;
  createdAt: string;
  user: { id: string; name: string; email: string };
  exercise: { id: string; name: string; category: string };
}

@Injectable({ providedIn: 'root' })
export class SessionsService {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<AdminSession[]>(`${environment.apiUrl}/sessions`);
  }
}
