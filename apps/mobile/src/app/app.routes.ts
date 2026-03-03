import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'exercises',
    canActivate: [authGuard],
    loadComponent: () => import('./components/exercise-library/exercise-library.component').then(m => m.ExerciseLibraryComponent)
  },
  {
    path: 'workout',
    canActivate: [authGuard],
    loadComponent: () => import('./components/workout-live/workout-live.component').then(m => m.WorkoutLiveComponent)
  },
  {
    path: 'programs',
    canActivate: [authGuard],
    loadComponent: () => import('./components/program-builder/program-builder.component').then(m => m.ProgramBuilderComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./components/account-settings/account-settings.component').then(m => m.AccountSettingsComponent)
  },
  { path: '**', redirectTo: '' }
];
