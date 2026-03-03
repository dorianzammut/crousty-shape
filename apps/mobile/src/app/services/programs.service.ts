import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Program {
  id: string;
  name: string;
  coach: string;
  level: string;
  duration: string;
  intensity: string;
}

@Injectable({ providedIn: 'root' })
export class ProgramsService {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<Program[]>(`${environment.apiUrl}/programs`);
  }
}
