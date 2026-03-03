import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import {
  LayoutDashboard, Dumbbell, ClipboardList, User,
  TrendingUp, Award, Calendar, ChevronRight, ChevronLeft,
  Search, Play, Star,
  X, Camera, RefreshCw, Info,
  Plus, Clock, Flame, Users, BookOpen,
  Settings, LogOut, Scale, Ruler, Target, Heart,
  BarChart3, Bell, ArrowUpRight, AlertCircle,
  Eye, EyeOff, SlidersHorizontal, Check, Trash2, Pencil,
  Mail, Lock,
} from 'lucide-angular';
import { authInterceptor } from './interceptors/auth.interceptor';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideCharts(withDefaultRegisterables()),
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        LayoutDashboard, Dumbbell, ClipboardList, User,
        TrendingUp, Award, Calendar, ChevronRight, ChevronLeft,
        Search, Play, Star,
        X, Camera, RefreshCw, Info,
        Plus, Clock, Flame, Users, BookOpen,
        Settings, LogOut, Scale, Ruler, Target, Heart,
        BarChart3, Bell, ArrowUpRight, AlertCircle,
        Eye, EyeOff, SlidersHorizontal, Check, Trash2, Pencil,
        Mail, Lock,
      })
    }, provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
  ]
};
