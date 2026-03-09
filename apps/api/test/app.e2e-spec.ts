import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './../src/auth/auth.service';
import { UsersService } from './../src/users/users.service';
import { ExercisesService } from './../src/exercises/exercises.service';
import { SessionsService } from './../src/sessions/sessions.service';
import { ProgramsService } from './../src/programs/programs.service';
import { AlertsService } from './../src/alerts/alerts.service';
import { FavoritesService } from './../src/favorites/favorites.service';
import { PrismaService } from './../src/prisma/prisma.service';
import { FirebaseService } from './../src/firebase/firebase.service';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const FAKE_USER = { id: 'user-1', email: 'alice@example.com', name: 'Alice', role: 'USER' };
const FAKE_ADMIN = { id: 'admin-1', email: 'admin@example.com', name: 'Admin', role: 'ADMIN' };
const FAKE_TOKEN_RESP = { access_token: 'signed.jwt.here', user: FAKE_USER };
const FAKE_EXERCISE = {
  id: 'ex-1',
  name: 'Squat',
  description: 'Leg exercise',
  category: 'LEGS',
  creatorId: 'user-1',
};
const FAKE_SESSION = {
  id: 'sess-1',
  userId: 'user-1',
  programId: null,
  exercises: [],
  duration: 60,
  createdAt: new Date().toISOString(),
};
const FAKE_PROGRAM = { id: 'prog-1', name: 'My Program', description: '', userId: 'user-1', exercises: [] };

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAuthService = {
  register: jest.fn().mockResolvedValue(FAKE_TOKEN_RESP),
  login: jest.fn().mockResolvedValue(FAKE_TOKEN_RESP),
};

const mockUsersService = {
  findOne: jest.fn().mockResolvedValue(FAKE_USER),
  findAll: jest.fn().mockResolvedValue([FAKE_USER, FAKE_ADMIN]),
  create: jest.fn().mockResolvedValue(FAKE_USER),
  update: jest.fn().mockResolvedValue(FAKE_USER),
  remove: jest.fn().mockResolvedValue({ message: 'Deleted' }),
  updateMe: jest.fn().mockResolvedValue(FAKE_USER),
  changePassword: jest.fn().mockResolvedValue({ message: 'Password updated' }),
  getStats: jest.fn().mockResolvedValue({ total: 2, active: 1 }),
  getGrowth: jest.fn().mockResolvedValue([{ month: 'Jan', count: 5 }]),
};

const mockExercisesService = {
  findAll: jest.fn().mockResolvedValue([FAKE_EXERCISE]),
  getCategories: jest.fn().mockResolvedValue(['LEGS', 'ARMS', 'CHEST']),
  findByCreator: jest.fn().mockResolvedValue([FAKE_EXERCISE]),
  findOne: jest.fn().mockResolvedValue(FAKE_EXERCISE),
  getSkeletonData: jest.fn().mockResolvedValue({ url: 'https://example.com/skeleton.json' }),
  getTemplateData: jest.fn().mockResolvedValue({ url: 'https://example.com/template.json' }),
  create: jest.fn().mockResolvedValue(FAKE_EXERCISE),
  update: jest.fn().mockResolvedValue(FAKE_EXERCISE),
  remove: jest.fn().mockResolvedValue({ message: 'Deleted' }),
  completeProcessing: jest.fn().mockResolvedValue(FAKE_EXERCISE),
};

const mockSessionsService = {
  findByUser: jest.fn().mockResolvedValue([FAKE_SESSION]),
  getWeeklyStats: jest.fn().mockResolvedValue({ week: [1, 2, 0, 3, 1, 0, 0] }),
  findAll: jest.fn().mockResolvedValue([FAKE_SESSION]),
  create: jest.fn().mockResolvedValue(FAKE_SESSION),
};

const mockProgramsService = {
  getMyPrograms: jest.fn().mockResolvedValue([FAKE_PROGRAM]),
  create: jest.fn().mockResolvedValue(FAKE_PROGRAM),
  delete: jest.fn().mockResolvedValue({ message: 'Deleted' }),
  addExercise: jest.fn().mockResolvedValue(FAKE_PROGRAM),
  updateExercise: jest.fn().mockResolvedValue(FAKE_PROGRAM),
  removeExercise: jest.fn().mockResolvedValue(FAKE_PROGRAM),
};

const mockAlertsService = {
  findAll: jest.fn().mockResolvedValue([{ id: 'alert-1', message: 'Test alert', type: 'INFO' }]),
};

const mockFavoritesService = {
  getAll: jest.fn().mockResolvedValue([FAKE_EXERCISE]),
  toggle: jest.fn().mockResolvedValue({ favorited: true }),
};

const mockPrismaService = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  user: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
};

const mockFirebaseService = {
  verifyToken: jest.fn(),
  uploadFile: jest.fn(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeToken(app: INestApplication, payload = { sub: 'user-1', email: 'alice@example.com', role: 'USER' }) {
  const jwtService = app.get(JwtService);
  return jwtService.sign(payload);
}

// ─── Setup ────────────────────────────────────────────────────────────────────

describe('API (e2e)', () => {
  let app: INestApplication<App>;
  let userToken: string;

  beforeAll(async () => {
    // Ensure JWT strategy uses the default 'changeme' secret
    process.env.JWT_SECRET = 'changeme';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService).useValue(mockPrismaService)
      .overrideProvider(FirebaseService).useValue(mockFirebaseService)
      .overrideProvider(AuthService).useValue(mockAuthService)
      .overrideProvider(UsersService).useValue(mockUsersService)
      .overrideProvider(ExercisesService).useValue(mockExercisesService)
      .overrideProvider(SessionsService).useValue(mockSessionsService)
      .overrideProvider(ProgramsService).useValue(mockProgramsService)
      .overrideProvider(AlertsService).useValue(mockAlertsService)
      .overrideProvider(FavoritesService).useValue(mockFavoritesService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userToken = makeToken(app, { sub: 'user-1', email: 'alice@example.com', role: 'USER' });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Restore default mock implementations after each test
    mockAuthService.register.mockResolvedValue(FAKE_TOKEN_RESP);
    mockAuthService.login.mockResolvedValue(FAKE_TOKEN_RESP);
    mockUsersService.findOne.mockResolvedValue(FAKE_USER);
    mockUsersService.findAll.mockResolvedValue([FAKE_USER, FAKE_ADMIN]);
    mockUsersService.create.mockResolvedValue(FAKE_USER);
    mockUsersService.update.mockResolvedValue(FAKE_USER);
    mockUsersService.remove.mockResolvedValue({ message: 'Deleted' });
    mockUsersService.updateMe.mockResolvedValue(FAKE_USER);
    mockUsersService.changePassword.mockResolvedValue({ message: 'Password updated' });
    mockUsersService.getStats.mockResolvedValue({ total: 2, active: 1 });
    mockUsersService.getGrowth.mockResolvedValue([{ month: 'Jan', count: 5 }]);
    mockExercisesService.findAll.mockResolvedValue([FAKE_EXERCISE]);
    mockExercisesService.getCategories.mockResolvedValue(['LEGS', 'ARMS', 'CHEST']);
    mockExercisesService.findByCreator.mockResolvedValue([FAKE_EXERCISE]);
    mockExercisesService.findOne.mockResolvedValue(FAKE_EXERCISE);
    mockExercisesService.create.mockResolvedValue(FAKE_EXERCISE);
    mockExercisesService.update.mockResolvedValue(FAKE_EXERCISE);
    mockExercisesService.remove.mockResolvedValue({ message: 'Deleted' });
    mockExercisesService.completeProcessing.mockResolvedValue(FAKE_EXERCISE);
    mockSessionsService.findByUser.mockResolvedValue([FAKE_SESSION]);
    mockSessionsService.getWeeklyStats.mockResolvedValue({ week: [1, 2, 0, 3, 1, 0, 0] });
    mockSessionsService.findAll.mockResolvedValue([FAKE_SESSION]);
    mockSessionsService.create.mockResolvedValue(FAKE_SESSION);
    mockProgramsService.getMyPrograms.mockResolvedValue([FAKE_PROGRAM]);
    mockProgramsService.create.mockResolvedValue(FAKE_PROGRAM);
    mockProgramsService.delete.mockResolvedValue({ message: 'Deleted' });
    mockProgramsService.addExercise.mockResolvedValue(FAKE_PROGRAM);
    mockProgramsService.updateExercise.mockResolvedValue(FAKE_PROGRAM);
    mockProgramsService.removeExercise.mockResolvedValue(FAKE_PROGRAM);
    mockAlertsService.findAll.mockResolvedValue([{ id: 'alert-1', message: 'Test alert', type: 'INFO' }]);
    mockFavoritesService.getAll.mockResolvedValue([FAKE_EXERCISE]);
    mockFavoritesService.toggle.mockResolvedValue({ favorited: true });
  });

  // ─── App ───────────────────────────────────────────────────────────────────

  describe('AppController', () => {
    it('GET / → 200 Hello World!', () => {
      return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
    });
  });

  // ─── Auth ──────────────────────────────────────────────────────────────────

  describe('Auth', () => {
    describe('POST /auth/register', () => {
      it('retourne 201 et un token avec des données valides', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send({ email: 'new@example.com', name: 'New User', password: 'password123' })
          .expect(201);

        expect(res.body).toHaveProperty('access_token');
        expect(res.body).toHaveProperty('user');
        expect(mockAuthService.register).toHaveBeenCalledWith({
          email: 'new@example.com',
          name: 'New User',
          password: 'password123',
        });
      });

      it('retourne 409 si l\'email est déjà utilisé', async () => {
        mockAuthService.register.mockRejectedValueOnce(new ConflictException('Email already in use'));
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({ email: 'alice@example.com', name: 'Alice', password: 'pass' })
          .expect(409);
      });
    });

    describe('POST /auth/login', () => {
      it('retourne 200 et un token avec des credentials valides', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'alice@example.com', password: 'password123' })
          .expect(200);

        expect(res.body).toHaveProperty('access_token');
        expect(res.body.user.email).toBe('alice@example.com');
      });

      it('retourne 401 avec des credentials invalides', async () => {
        mockAuthService.login.mockRejectedValueOnce(new UnauthorizedException('Invalid credentials'));
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'alice@example.com', password: 'wrongpass' })
          .expect(401);
      });

      it('retourne 401 avec un email inexistant', async () => {
        mockAuthService.login.mockRejectedValueOnce(new UnauthorizedException('Invalid credentials'));
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'nobody@example.com', password: 'pass' })
          .expect(401);
      });
    });
  });

  // ─── Users ─────────────────────────────────────────────────────────────────

  describe('Users', () => {
    it('GET /users/me → 401 sans token', () => {
      return request(app.getHttpServer()).get('/users/me').expect(401);
    });

    it('GET /users/me → 200 avec le profil de l\'utilisateur', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('email');
      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-1');
    });

    it('PATCH /users/me → 200 met à jour le profil', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Alice Updated' })
        .expect(200);

      expect(mockUsersService.updateMe).toHaveBeenCalledWith('user-1', { name: 'Alice Updated' });
    });

    it('PATCH /users/me/password → 200 change le mot de passe', async () => {
      await request(app.getHttpServer())
        .patch('/users/me/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ currentPassword: 'old', newPassword: 'new' })
        .expect(200);

      expect(mockUsersService.changePassword).toHaveBeenCalledWith('user-1', {
        currentPassword: 'old',
        newPassword: 'new',
      });
    });

    it('PATCH /users/me/password → 401 sans token', () => {
      return request(app.getHttpServer())
        .patch('/users/me/password')
        .send({ currentPassword: 'old', newPassword: 'new' })
        .expect(401);
    });

    it('GET /users/stats → 200 retourne les statistiques', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('total');
    });

    it('GET /users/growth → 200 retourne la croissance', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/growth')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /users → 200 retourne la liste des utilisateurs', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('GET /users/:id → 200 retourne un utilisateur par ID', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/user-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-1');
    });

    it('GET /users/:id → 404 si l\'utilisateur n\'existe pas', async () => {
      mockUsersService.findOne.mockRejectedValueOnce(new NotFoundException('User not found'));
      await request(app.getHttpServer())
        .get('/users/unknown-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('POST /users → 201 crée un utilisateur', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ email: 'bob@example.com', name: 'Bob', password: 'pass', role: 'USER' })
        .expect(201);

      expect(mockUsersService.create).toHaveBeenCalled();
    });

    it('PATCH /users/:id → 200 met à jour un utilisateur', async () => {
      await request(app.getHttpServer())
        .patch('/users/user-1')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Alice V2' })
        .expect(200);

      expect(mockUsersService.update).toHaveBeenCalledWith('user-1', { name: 'Alice V2' });
    });

    it('DELETE /users/:id → 200 supprime un utilisateur', async () => {
      await request(app.getHttpServer())
        .delete('/users/other-user')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(mockUsersService.remove).toHaveBeenCalledWith('other-user');
    });

    it('DELETE /users/:id → 403 si on essaie de supprimer son propre compte', async () => {
      await request(app.getHttpServer())
        .delete('/users/user-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('GET /users → 401 sans token', () => {
      return request(app.getHttpServer()).get('/users').expect(401);
    });
  });

  // ─── Exercises ─────────────────────────────────────────────────────────────

  describe('Exercises', () => {
    it('GET /exercises → 200 liste tous les exercices (public)', async () => {
      const res = await request(app.getHttpServer()).get('/exercises').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /exercises/categories → 200 retourne les catégories (public)', async () => {
      const res = await request(app.getHttpServer()).get('/exercises/categories').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toContain('LEGS');
    });

    it('GET /exercises/mine → 401 sans token', () => {
      return request(app.getHttpServer()).get('/exercises/mine').expect(401);
    });

    it('GET /exercises/mine → 200 retourne les exercices du créateur', async () => {
      const res = await request(app.getHttpServer())
        .get('/exercises/mine')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(mockExercisesService.findByCreator).toHaveBeenCalledWith('user-1');
    });

    it('GET /exercises/:id → 200 retourne un exercice par ID (public)', async () => {
      const res = await request(app.getHttpServer()).get('/exercises/ex-1').expect(200);
      expect(res.body).toHaveProperty('name', 'Squat');
    });

    it('GET /exercises/:id → 404 si l\'exercice n\'existe pas', async () => {
      mockExercisesService.findOne.mockRejectedValueOnce(new NotFoundException('Exercise not found'));
      await request(app.getHttpServer()).get('/exercises/unknown').expect(404);
    });

    it('GET /exercises/:id/skeleton → 200 retourne les données skeleton (public)', async () => {
      const res = await request(app.getHttpServer()).get('/exercises/ex-1/skeleton').expect(200);
      expect(res.body).toHaveProperty('url');
    });

    it('GET /exercises/:id/template → 200 retourne les données template (public)', async () => {
      const res = await request(app.getHttpServer()).get('/exercises/ex-1/template').expect(200);
      expect(res.body).toHaveProperty('url');
    });

    it('POST /exercises → 401 sans token', () => {
      return request(app.getHttpServer())
        .post('/exercises')
        .send({ name: 'Push-up', category: 'CHEST' })
        .expect(401);
    });

    it('POST /exercises → 201 crée un exercice', async () => {
      const res = await request(app.getHttpServer())
        .post('/exercises')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Push-up', category: 'CHEST' })
        .expect(201);

      expect(mockExercisesService.create).toHaveBeenCalledWith({ name: 'Push-up', category: 'CHEST' }, 'user-1');
    });

    it('POST /exercises/:id/processing-complete → 200 met à jour le statut de traitement', async () => {
      await request(app.getHttpServer())
        .post('/exercises/ex-1/processing-complete')
        .send({ status: 'DONE', skeletonUrl: 'https://example.com/skeleton.json' })
        .expect(201);

      expect(mockExercisesService.completeProcessing).toHaveBeenCalledWith('ex-1', {
        status: 'DONE',
        skeletonUrl: 'https://example.com/skeleton.json',
      });
    });

    it('PATCH /exercises/:id → 401 sans token', () => {
      return request(app.getHttpServer())
        .patch('/exercises/ex-1')
        .send({ name: 'Updated Squat' })
        .expect(401);
    });

    it('PATCH /exercises/:id → 200 met à jour un exercice', async () => {
      await request(app.getHttpServer())
        .patch('/exercises/ex-1')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated Squat' })
        .expect(200);

      expect(mockExercisesService.update).toHaveBeenCalledWith('ex-1', { name: 'Updated Squat' });
    });

    it('DELETE /exercises/:id → 401 sans token', () => {
      return request(app.getHttpServer()).delete('/exercises/ex-1').expect(401);
    });

    it('DELETE /exercises/:id → 200 supprime un exercice', async () => {
      await request(app.getHttpServer())
        .delete('/exercises/ex-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(mockExercisesService.remove).toHaveBeenCalledWith('ex-1', 'user-1', 'USER');
    });
  });

  // ─── Sessions ──────────────────────────────────────────────────────────────

  describe('Sessions', () => {
    it('GET /sessions/mine → 401 sans token', () => {
      return request(app.getHttpServer()).get('/sessions/mine').expect(401);
    });

    it('GET /sessions/mine → 200 retourne les sessions de l\'utilisateur', async () => {
      const res = await request(app.getHttpServer())
        .get('/sessions/mine')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(mockSessionsService.findByUser).toHaveBeenCalledWith('user-1');
    });

    it('GET /sessions/stats → 200 retourne les statistiques hebdomadaires', async () => {
      const res = await request(app.getHttpServer())
        .get('/sessions/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('week');
    });

    it('GET /sessions → 200 retourne toutes les sessions', async () => {
      const res = await request(app.getHttpServer())
        .get('/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /sessions/user/:userId → 200 retourne les sessions d\'un utilisateur', async () => {
      const res = await request(app.getHttpServer())
        .get('/sessions/user/user-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(mockSessionsService.findByUser).toHaveBeenCalledWith('user-1');
    });

    it('POST /sessions → 401 sans token', () => {
      return request(app.getHttpServer()).post('/sessions').send({ duration: 60 }).expect(401);
    });

    it('POST /sessions → 201 crée une session', async () => {
      const res = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ duration: 90, exercises: [] })
        .expect(201);

      expect(mockSessionsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', duration: 90 }),
      );
    });
  });

  // ─── Programs ──────────────────────────────────────────────────────────────

  describe('Programs', () => {
    it('GET /programs → 401 sans token', () => {
      return request(app.getHttpServer()).get('/programs').expect(401);
    });

    it('GET /programs → 200 retourne les programmes de l\'utilisateur', async () => {
      const res = await request(app.getHttpServer())
        .get('/programs')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(mockProgramsService.getMyPrograms).toHaveBeenCalledWith('user-1');
    });

    it('POST /programs → 201 crée un programme', async () => {
      const res = await request(app.getHttpServer())
        .post('/programs')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Push Day', description: 'Chest and triceps' })
        .expect(201);

      expect(mockProgramsService.create).toHaveBeenCalledWith('user-1', {
        name: 'Push Day',
        description: 'Chest and triceps',
      });
    });

    it('DELETE /programs/:id → 401 sans token', () => {
      return request(app.getHttpServer()).delete('/programs/prog-1').expect(401);
    });

    it('DELETE /programs/:id → 200 supprime un programme', async () => {
      await request(app.getHttpServer())
        .delete('/programs/prog-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(mockProgramsService.delete).toHaveBeenCalledWith('user-1', 'prog-1');
    });

    it('POST /programs/:id/exercises → 201 ajoute un exercice au programme', async () => {
      const res = await request(app.getHttpServer())
        .post('/programs/prog-1/exercises')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ exerciseId: 'ex-1', sets: 3, reps: 10 })
        .expect(201);

      expect(mockProgramsService.addExercise).toHaveBeenCalledWith('user-1', 'prog-1', {
        exerciseId: 'ex-1',
        sets: 3,
        reps: 10,
      });
    });

    it('PATCH /programs/:id/exercises/:exerciseId → 200 met à jour un exercice dans le programme', async () => {
      await request(app.getHttpServer())
        .patch('/programs/prog-1/exercises/ex-1')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ sets: 4, reps: 12 })
        .expect(200);

      expect(mockProgramsService.updateExercise).toHaveBeenCalledWith('user-1', 'prog-1', 'ex-1', {
        sets: 4,
        reps: 12,
      });
    });

    it('DELETE /programs/:id/exercises/:exerciseId → 200 retire un exercice du programme', async () => {
      await request(app.getHttpServer())
        .delete('/programs/prog-1/exercises/ex-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(mockProgramsService.removeExercise).toHaveBeenCalledWith('user-1', 'prog-1', 'ex-1');
    });
  });

  // ─── Alerts ────────────────────────────────────────────────────────────────

  describe('Alerts', () => {
    it('GET /alerts → 401 sans token', () => {
      return request(app.getHttpServer()).get('/alerts').expect(401);
    });

    it('GET /alerts → 200 retourne les alertes', async () => {
      const res = await request(app.getHttpServer())
        .get('/alerts')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('message');
    });
  });

  // ─── Favorites ─────────────────────────────────────────────────────────────

  describe('Favorites', () => {
    it('GET /favorites → 401 sans token', () => {
      return request(app.getHttpServer()).get('/favorites').expect(401);
    });

    it('GET /favorites → 200 retourne les favoris de l\'utilisateur', async () => {
      const res = await request(app.getHttpServer())
        .get('/favorites')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(mockFavoritesService.getAll).toHaveBeenCalledWith('user-1');
    });

    it('POST /favorites/:exerciseId → 401 sans token', () => {
      return request(app.getHttpServer()).post('/favorites/ex-1').expect(401);
    });

    it('POST /favorites/:exerciseId → 201 toggle favori', async () => {
      const res = await request(app.getHttpServer())
        .post('/favorites/ex-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      expect(res.body).toHaveProperty('favorited');
      expect(mockFavoritesService.toggle).toHaveBeenCalledWith('user-1', 'ex-1');
    });

    it('POST /favorites/:exerciseId → 201 untoggle favori (appel répété)', async () => {
      mockFavoritesService.toggle.mockResolvedValueOnce({ favorited: false });
      const res = await request(app.getHttpServer())
        .post('/favorites/ex-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(201);

      expect(res.body.favorited).toBe(false);
    });
  });

  // ─── Tokens invalides ──────────────────────────────────────────────────────

  describe('Token invalide', () => {
    const protectedRoutes = [
      { method: 'get', path: '/users/me' },
      { method: 'get', path: '/exercises/mine' },
      { method: 'get', path: '/sessions/mine' },
      { method: 'get', path: '/programs' },
      { method: 'get', path: '/alerts' },
      { method: 'get', path: '/favorites' },
    ];

    it.each(protectedRoutes)('$method $path → 401 avec token malformé', async ({ method, path }) => {
      await (request(app.getHttpServer()) as any)
        [method](path)
        .set('Authorization', 'Bearer token.invalide.ici')
        .expect(401);
    });
  });
});
