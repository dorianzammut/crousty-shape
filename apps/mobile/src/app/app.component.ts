import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { BottomNavComponent } from './components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, BottomNavComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private router = inject(Router);
  currentRoute = '';

  constructor() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.currentRoute = e.urlAfterRedirects?.replace('/', '') || '';
    });
  }

  get isAdminView(): boolean {
    return this.currentRoute === 'admin';
  }

  get isWorkoutView(): boolean {
    return this.currentRoute === 'workout';
  }

  get showBottomNav(): boolean {
    return !this.isWorkoutView && !this.isAdminView;
  }

  toggleAdmin(): void {
    if (this.isAdminView) {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/admin']);
    }
  }
}
