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
        { name: 'Squat Gobelet',       category: 'Jambes',    level: 'Débutant',     imageUrl: 'https://images.unsplash.com/photo-1645810809381-97f6fd2f7d10?w=600&auto=format&fit=crop' },
        { name: 'Pompes Classiques',   category: 'Pectoraux', level: 'Intermédiaire',imageUrl: 'https://images.unsplash.com/photo-1525565004407-a1f6f55b5dd6?w=600&auto=format&fit=crop' },
        { name: 'Soulevé de Terre',    category: 'Dos',       level: 'Avancé',       imageUrl: 'https://images.unsplash.com/photo-1758875569256-f37c438cac65?w=600&auto=format&fit=crop' },
        { name: 'Développé Couché',    category: 'Pectoraux', level: 'Intermédiaire',imageUrl: 'https://images.unsplash.com/photo-1651346847980-ab1c883e8cc8?w=600&auto=format&fit=crop' },
        { name: 'Fentes Marchées',     category: 'Jambes',    level: 'Débutant',     imageUrl: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=600&auto=format&fit=crop' },
        { name: 'Tractions',           category: 'Dos',       level: 'Avancé',       imageUrl: 'https://images.unsplash.com/photo-1598971639058-aba3c391c0a6?w=600&auto=format&fit=crop' },
        { name: 'Curl Biceps',         category: 'Bras',      level: 'Débutant',     imageUrl: null },
        { name: 'Élévations Latérales',category: 'Épaules',   level: 'Intermédiaire',imageUrl: null },
      ],
    });
    console.log('✅ Exercises seeded');
  }

  // ── Programs ─────────────────────────────────────────────────────────────────
  const programCount = await prisma.program.count();
  if (programCount === 0) {
    await prisma.program.createMany({
      data: [
        { name: 'Béton Armé',     coach: 'Coach Lucas', level: 'Avancé',        duration: '8 sem.', intensity: 'Haute' },
        { name: 'Remise en Forme',coach: 'Coach Sarah', level: 'Débutant',      duration: '4 sem.', intensity: 'Moyenne' },
        { name: 'Volume Explosif',coach: 'Coach Marc',  level: 'Intermédiaire', duration: '6 sem.', intensity: 'Élevée' },
      ],
    });
    console.log('✅ Programs seeded');
  }

  console.log('🌱 Seed complete');
  console.log('   Admin login: admin@croustyshape.com / Admin1234!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
