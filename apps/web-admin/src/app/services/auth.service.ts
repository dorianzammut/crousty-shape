import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _token = signal<string | null>(localStorage.getItem('admin_token'));
  private _user = signal<AuthUser | null>(this.parseUser(localStorage.getItem('admin_user')));

  readonly isAuthenticated = computed(() => !!this._token());
  readonly currentUser = computed(() => this._user());
  readonly token = computed(() => this._token());

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => {
        if (res.user.role !== 'ADMIN') throw new Error('Accès réservé aux administrateurs');
        this.setSession(res);
      })
    );
  }

  logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private setSession(res: AuthResponse) {
    localStorage.setItem('admin_token', res.access_token);
    localStorage.setItem('admin_user', JSON.stringify(res.user));
    this._token.set(res.access_token);
    this._user.set(res.user);
  }

  private parseUser(json: string | null): AuthUser | null {
    try { return json ? JSON.parse(json) : null; } catch { return null; }
  }
}
