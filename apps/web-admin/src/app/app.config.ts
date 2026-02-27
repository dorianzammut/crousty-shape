import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import {
  Users, Dumbbell, BarChart3, Settings, Bell, Search,
  ArrowUpRight, ChevronRight, AlertCircle, TrendingUp,
  LayoutDashboard, ClipboardList, LogOut, Menu, X
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideCharts(withDefaultRegisterables()),
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Users, Dumbbell, BarChart3, Settings, Bell, Search,
        ArrowUpRight, ChevronRight, AlertCircle, TrendingUp,
        LayoutDashboard, ClipboardList, LogOut, Menu, X
      })
    }
  ]
};
