process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const BloodInventory = require('../models/BloodInventory');

let mongoServer;
let adminToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create admin and get token
  const res = await request(app).post('/api/v1/auth/register').send({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
  });
  adminToken = res.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await BloodInventory.deleteMany({});
});

describe('Inventory API', () => {
  const testInventory = {
    bloodGroup: 'O-',
    units: 42,
    capacity: 500,
    source: 'Donor Portal',
  };

  describe('POST /api/v1/inventory', () => {
    it('should add inventory (admin)', async () => {
      const res = await request(app)
        .post('/api/v1/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testInventory)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.bloodGroup).toBe('O-');
      expect(res.body.data.status).toBe('Critical'); // 42/500 = 8.4%
    });

    it('should reject without auth', async () => {
      await request(app)
        .post('/api/v1/inventory')
        .send(testInventory)
        .expect(401);
    });

    it('should reject donor role', async () => {
      const donorRes = await request(app).post('/api/v1/auth/register').send({
        name: 'Donor',
        email: 'donor@test.com',
        password: 'password123',
        role: 'donor',
      });

      await request(app)
        .post('/api/v1/inventory')
        .set('Authorization', `Bearer ${donorRes.body.data.accessToken}`)
        .send(testInventory)
        .expect(403);
    });
  });

  describe('GET /api/v1/inventory', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testInventory);

      await request(app)
        .post('/api/v1/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...testInventory, bloodGroup: 'A+', units: 842 });
    });

    it('should get all inventory', async () => {
      const res = await request(app)
        .get('/api/v1/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter by blood group', async () => {
      const res = await request(app)
        .get('/api/v1/inventory?bloodGroup=O-')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].bloodGroup).toBe('O-');
    });
  });

  describe('GET /api/v1/inventory/availability/:bloodGroup', () => {
    it('should check availability', async () => {
      await request(app)
        .post('/api/v1/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testInventory);

      const res = await request(app)
        .get('/api/v1/inventory/availability/O-')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.bloodGroup).toBe('O-');
      expect(res.body.data.totalUnits).toBe(42);
      expect(res.body.data.isAvailable).toBe(true);
    });
  });
});
