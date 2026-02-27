import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'exercises',
    loadComponent: () => import('./components/exercise-library/exercise-library.component').then(m => m.ExerciseLibraryComponent)
  },
  {
    path: 'workout',
    loadComponent: () => import('./components/workout-live/workout-live.component').then(m => m.WorkoutLiveComponent)
  },
  {
    path: 'programs',
    loadComponent: () => import('./components/program-builder/program-builder.component').then(m => m.ProgramBuilderComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  { path: '**', redirectTo: '' }
];
