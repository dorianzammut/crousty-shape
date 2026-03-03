import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count?: { sessions: number };
}

export interface Stats {
  users: number;
  sessions: number;
  alerts: number;
}

export interface GrowthData {
  labels: string[];
  data: number[];
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<AdminUser[]>(`${environment.apiUrl}/users`);
  }

  getStats() {
    return this.http.get<Stats>(`${environment.apiUrl}/users/stats`);
  }

  getGrowth(range: string) {
    return this.http.get<GrowthData>(`${environment.apiUrl}/users/growth`, { params: { range } });
  }

  create(dto: { email: string; name: string; password: string; role: string }) {
    return this.http.post<AdminUser>(`${environment.apiUrl}/users`, dto);
  }

  delete(id: string) {
    return this.http.delete(`${environment.apiUrl}/users/${id}`);
  }
}
