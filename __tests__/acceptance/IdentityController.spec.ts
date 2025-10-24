import request from 'supertest';
import { startTestDb, stopTestDb } from '../integration/testdb';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/presentation/app';
import { randomUUID } from 'crypto';
import { Argon2PasswordHasher } from 'src/infrastructure/services/Argon2PasswordHasher';
import { httpConfig } from 'src/presentation/config';

describe('IdentityController (acceptance)', () => {
  let app: ReturnType<typeof createApp>;
  let prisma: PrismaClient;
  let hashPassword: Argon2PasswordHasher;

  beforeAll(async () => {
    await startTestDb();
    prisma = new PrismaClient();
    hashPassword = new Argon2PasswordHasher({ optionsArgon2: {} });

    await prisma.$connect();
    app = createApp();
  }, 20000);

  afterAll(async () => {
    await prisma.$disconnect();
    await stopTestDb();
  });

  beforeEach(async () => {
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /register', () => {
    it('should register and set access token cookie', async () => {
      const res = await request(app)
        .post('/identity/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          id: randomUUID(),
          name: 'UserName',
        })
        .expect(201);

      const cookies = res.get('Set-Cookie');
      expect(cookies).toBeDefined();
      expect(cookies?.[0]).toContain('access_token');
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      await prisma.user.create({
        data: {
          email: 'user@example.com',
          passwordHash: await hashPassword.hash('Password123!'),
          name: 'UserName',
          createdAt: new Date('2025/06/05').toISOString(),
          id: randomUUID(),
        },
      });
    });

    it('should login existing user and return access token cookie', async () => {
      const res = await request(app)
        .post('/identity/login')
        .send({ email: 'user@example.com', password: 'Password123!' })
        .expect(200);

      expect(res.body.data).toHaveProperty('email', 'user@example.com');
      const cookies = res.get('Set-Cookie');
      expect(cookies?.[0]).toContain('access_token');
    });

    it('should return 401 on invalid credentials', async () => {
      const res = await request(app)
        .post('/identity/login')
        .send({ email: 'user@example.com', password: 'wrongpass' })
        .expect(401);

      expect(res.body.error.code).toBe('InvalidCredentialsError');
    });
  });

  describe('POST /logout', () => {
    it('should clear access token cookie', async () => {
      const res = await request(app)
        .post('/identity/logout')
        .set('Cookie', [
          `${httpConfig.tokenCookie.name}=mocked_token; Path=${httpConfig.tokenCookie.path}; HttpOnly`,
        ])
        .expect(204);

      const cookies = res.get('Set-Cookie');
      expect(cookies?.[0]).toContain(`${httpConfig.tokenCookie.name}=`);
    });
  });
});
