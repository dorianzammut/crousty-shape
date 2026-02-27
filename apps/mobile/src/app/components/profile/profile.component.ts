import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

interface Stat {
  label: string;
  value: string;
  icon: string;
}

interface MenuItem {
  label: string;
  icon: string;
}

interface Badge {
  label: string;
}

@Component({
  selector: 'app-profile',
  imports: [LucideAngularModule],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  @ViewChild('progressBar', { static: false }) progressBarRef!: ElementRef<HTMLDivElement>;

  stats: Stat[] = [
    { label: 'Poids', value: '78 kg', icon: 'scale' },
    { label: 'Taille', value: '182 cm', icon: 'ruler' },
    { label: 'Objectif', value: 'Prise de masse', icon: 'target' },
  ];

  menuItems: MenuItem[] = [
    { label: 'Paramètres du compte', icon: 'settings' },
    { label: "Préférences d'entraînement", icon: 'heart' },
    { label: 'Historique des paiements', icon: 'chevron-right' },
  ];

  badges: Badge[] = [
    { label: 'Série de 7j' },
    { label: 'Lève-tôt' },
    { label: "Bras d'acier" },
    { label: 'Poids Plume' },
  ];

  progressWidth = '0%';

  ngOnInit(): void {
    setTimeout(() => {
      this.progressWidth = '65%';
    }, 300);
  }
}
