import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ExerciseTemplate } from '../utils/rep-detection';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private http = inject(HttpClient);
  private cache = new Map<string, Observable<ExerciseTemplate | null>>();

  /** Fetch template via API proxy: GET /exercises/:id/template */
  getTemplate(exerciseId: string): Observable<ExerciseTemplate | null> {
    if (!exerciseId) return of(null);

    if (this.cache.has(exerciseId)) {
      return this.cache.get(exerciseId)!;
    }

    const req$ = this.http.get<ExerciseTemplate>(
      `${environment.apiUrl}/exercises/${exerciseId}/template`
    ).pipe(
      catchError(() => of(null)),
      shareReplay(1),
    );

    this.cache.set(exerciseId, req$);
    return req$;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
