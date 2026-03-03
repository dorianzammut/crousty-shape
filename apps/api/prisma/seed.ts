import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // ── Admin user ──────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin1234!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@croustyshape.com' },
    update: {},
    create: { email: 'admin@croustyshape.com', name: 'Admin', password: adminHash, role: 'ADMIN' },
  });

  // ── Exercises ────────────────────────────────────────────────────────────────
  const exerciseCount = await prisma.exercise.count();
  if (exerciseCount === 0) {
    await prisma.exercise.createMany({
      data: [
        { name: 'Squat Gobelet',       category: 'BAS_DU_CORPS',  level: 'Débutant',     imageUrl: 'https://images.unsplash.com/photo-1645810809381-97f6fd2f7d10?w=600&auto=format&fit=crop', description: 'Squat avec haltère tenu contre la poitrine.' },
        { name: 'Pompes Classiques',   category: 'HAUT_DU_CORPS', level: 'Intermédiaire',imageUrl: 'https://images.unsplash.com/photo-1525565004407-a1f6f55b5dd6?w=600&auto=format&fit=crop', description: 'Exercice de base pour les pectoraux et triceps.' },
        { name: 'Soulevé de Terre',    category: 'FORCE',         level: 'Avancé',       imageUrl: 'https://images.unsplash.com/photo-1758875569256-f37c438cac65?w=600&auto=format&fit=crop', description: 'Mouvement polyarticulaire pour le dos et les jambes.' },
        { name: 'Développé Couché',    category: 'HAUT_DU_CORPS', level: 'Intermédiaire',imageUrl: 'https://images.unsplash.com/photo-1651346847980-ab1c883e8cc8?w=600&auto=format&fit=crop', description: 'Exercice phare pour les pectoraux.' },
        { name: 'Fentes Marchées',     category: 'BAS_DU_CORPS',  level: 'Débutant',     imageUrl: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=600&auto=format&fit=crop', description: 'Fentes en avançant pour quadriceps et fessiers.' },
        { name: 'Tractions',           category: 'HAUT_DU_CORPS', level: 'Avancé',       imageUrl: 'https://images.unsplash.com/photo-1598971639058-aba3c391c0a6?w=600&auto=format&fit=crop', description: 'Exercice au poids du corps pour le dos.' },
        { name: 'Curl Biceps',         category: 'HAUT_DU_CORPS', level: 'Débutant',     imageUrl: null, description: 'Flexion des bras pour les biceps.' },
        { name: 'Élévations Latérales',category: 'HAUT_DU_CORPS', level: 'Intermédiaire',imageUrl: null, description: 'Isolation des épaules (deltoïdes latéraux).' },
      ],
    });
    console.log('✅ Exercises seeded');
  }

  // ── Demo sessions for admin user ────────────────────────────────────────────
  const admin = await prisma.user.findUnique({ where: { email: 'admin@croustyshape.com' } });
  const exercises = await prisma.exercise.findMany({ take: 5 });
  const sessionCount = await prisma.session.count({ where: { userId: admin!.id } });

  if (sessionCount === 0 && exercises.length > 0) {
    const demoSessions = [
      { exerciseId: exercises[0].id, reps: 15, qualityScore: 88, duration: 420, daysAgo: 0 },
      { exerciseId: exercises[1].id, reps: 20, qualityScore: 74, duration: 600, daysAgo: 1 },
      { exerciseId: exercises[2].id, reps: 8,  qualityScore: 92, duration: 900, daysAgo: 2 },
      { exerciseId: exercises[3].id, reps: 12, qualityScore: 65, duration: 540, daysAgo: 4 },
      { exerciseId: exercises[4].id, reps: 18, qualityScore: 81, duration: 480, daysAgo: 6 },
    ];

    for (const s of demoSessions) {
      const createdAt = new Date(Date.now() - s.daysAgo * 24 * 60 * 60 * 1000);
      await prisma.session.create({
        data: { userId: admin!.id, exerciseId: s.exerciseId, reps: s.reps, qualityScore: s.qualityScore, duration: s.duration, createdAt },
      });
    }
    console.log('✅ Demo sessions seeded');
  }

  console.log('🌱 Seed complete');
  console.log('   Admin login: admin@croustyshape.com / Admin1234!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
