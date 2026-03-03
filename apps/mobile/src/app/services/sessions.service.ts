import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Session {
  id: string;
  reps: number;
  qualityScore: number;
  duration: number;
  createdAt: string;
  exercise: { id: string; name: string; category: string };
}

export interface WeeklyStats {
  labels: string[];
  data: number[];
}

@Injectable({ providedIn: 'root' })
export class SessionsService {
  private http = inject(HttpClient);

  getMine() {
    return this.http.get<Session[]>(`${environment.apiUrl}/sessions/mine`);
  }

  getStats() {
    return this.http.get<WeeklyStats>(`${environment.apiUrl}/sessions/stats`);
  }

  create(data: { exerciseId: string; reps: number; qualityScore: number; duration: number }) {
    return this.http.post<Session>(`${environment.apiUrl}/sessions`, data);
  }
}
