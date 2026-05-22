process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

// Create a fresh app import without rate limiting interference between tests
let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  // Import app after DB connection
  app = require('../app');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  role: 'donor',
  bloodGroup: 'O+',
};

describe('Auth API - Registration', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('should not register with existing email', async () => {
    await request(app).post('/api/v1/auth/register').send(testUser);
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...testUser, email: 'test2@example.com' })
      .send(testUser)
      .expect(409);

    expect(res.body.success).toBe(false);
  });

  it('should not register without required fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'only@example.com' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('should not register with invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...testUser, email: 'notanemail' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});

describe('Auth API - Login', () => {
  let registeredUser;

  beforeEach(async () => {
    registeredUser = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...testUser, email: `login-${Date.now()}@example.com` });
  });

  it('should login with valid credentials', async () => {
    const email = registeredUser.body.data.user.email;
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: testUser.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should not login with wrong password', async () => {
    const email = registeredUser.body.data.user.email;
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'wrongpassword' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it('should not login with non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody-exists@example.com', password: 'password123' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });
});

describe('Auth API - Profile & Logout', () => {
  let accessToken;

  beforeEach(async () => {
    const unique = Date.now();
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...testUser, email: `profile-${unique}@example.com` });
    accessToken = res.body.data.accessToken;
  });

  it('should get user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.name).toBe(testUser.name);
  });

  it('should reject without token', async () => {
    await request(app).get('/api/v1/auth/me').expect(401);
  });

  it('should reject with invalid token', async () => {
    await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalidtoken123')
      .expect(401);
  });

  it('should logout successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});
