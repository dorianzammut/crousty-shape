import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

interface CoachProgram {
  id: number;
  name: string;
  coach: string;
  level: string;
  duration: string;
  intensity: string;
}

interface CustomProgram {
  name: string;
  exercises: number;
  lastDone: string;
}

@Component({
  selector: 'app-program-builder',
  imports: [LucideAngularModule],
  templateUrl: './program-builder.component.html'
})
export class ProgramBuilderComponent {
  customPrograms: CustomProgram[] = [
    { name: 'Poussée (Push)', exercises: 6, lastDone: "Aujourd'hui" },
    { name: 'Tirage (Pull)', exercises: 5, lastDone: 'Hier' },
  ];

  coachPrograms: CoachProgram[] = [
    { id: 1, name: 'Béton Armé', coach: 'Coach Lucas', level: 'Avancé', duration: '8 sem.', intensity: 'Haute' },
    { id: 2, name: 'Remise en Forme', coach: 'Coach Sarah', level: 'Débutant', duration: '4 sem.', intensity: 'Moyenne' },
    { id: 3, name: 'Volume Explosif', coach: 'Coach Marc', level: 'Intermédiaire', duration: '6 sem.', intensity: 'Élevée' },
  ];
}
