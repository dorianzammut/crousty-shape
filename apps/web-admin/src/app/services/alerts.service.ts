import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AlertItem {
  id: string;
  message: string;
  severity: 'MODERATE' | 'CRITICAL';
  createdAt: string;
  user: { id: string; name: string; email: string };
  exercise: { id: string; name: string };
}

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<AlertItem[]>(`${environment.apiUrl}/alerts`);
  }
}
