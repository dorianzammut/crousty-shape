import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import {
  LayoutDashboard, Dumbbell, ClipboardList, User,
  TrendingUp, Award, Calendar, ChevronRight,
  Search, Play, Star,
  X, Camera, RefreshCw, Info,
  Plus, Clock, Flame, Users, BookOpen,
  Settings, LogOut, Scale, Ruler, Target, Heart,
  BarChart3, Bell, ArrowUpRight, AlertCircle,
  Eye, EyeOff,
} from 'lucide-angular';
import { authInterceptor } from './interceptors/auth.interceptor';

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
        TrendingUp, Award, Calendar, ChevronRight,
        Search, Play, Star,
        X, Camera, RefreshCw, Info,
        Plus, Clock, Flame, Users, BookOpen,
        Settings, LogOut, Scale, Ruler, Target, Heart,
        BarChart3, Bell, ArrowUpRight, AlertCircle,
        Eye, EyeOff,
      })
    }
  ]
};
