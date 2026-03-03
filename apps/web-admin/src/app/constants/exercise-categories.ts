export const EXERCISE_CATEGORIES: { value: string; label: string }[] = [
  // Types d'entraînement
  { value: 'FORCE', label: 'Force' },
  { value: 'CARDIO', label: 'Cardio' },
  { value: 'HIIT', label: 'HIIT' },
  { value: 'MOBILITE', label: 'Mobilité' },
  { value: 'EQUILIBRE', label: 'Équilibre' },
  { value: 'FULL_BODY', label: 'Full body' },
  { value: 'ETIREMENTS', label: 'Étirements' },
  { value: 'PLYOMETRIE', label: 'Pliométrie' },
  { value: 'FONCTIONNEL', label: 'Fonctionnel' },
  { value: 'COMBAT', label: 'Combat' },
  // Haut du corps
  { value: 'PECTORAUX', label: 'Pectoraux' },
  { value: 'DELTOIDES', label: 'Deltoïdes' },
  { value: 'BICEPS', label: 'Biceps' },
  { value: 'TRICEPS', label: 'Triceps' },
  { value: 'AVANT_BRAS', label: 'Avant-bras' },
  { value: 'TRAPEZES', label: 'Trapèzes' },
  { value: 'GRAND_DORSAL', label: 'Grand dorsal' },
  { value: 'RHOMBOIDES', label: 'Rhomboïdes' },
  // Tronc
  { value: 'ABDOMINAUX', label: 'Abdominaux' },
  { value: 'OBLIQUES', label: 'Obliques' },
  { value: 'LOMBAIRES', label: 'Lombaires' },
  // Bas du corps
  { value: 'QUADRICEPS', label: 'Quadriceps' },
  { value: 'ISCHIO_JAMBIERS', label: 'Ischio-jambiers' },
  { value: 'FESSIERS', label: 'Fessiers' },
  { value: 'ADDUCTEURS', label: 'Adducteurs' },
  { value: 'MOLLETS', label: 'Mollets' },
  // Autre
  { value: 'SPORT_SPECIFIQUE', label: 'Sport spécifique' },
  { value: 'AUTRE', label: 'Autre' },
];

export function getCategoryLabel(value: string): string {
  return EXERCISE_CATEGORIES.find(c => c.value === value)?.label ?? value;
}
