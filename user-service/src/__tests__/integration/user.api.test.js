const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../../app');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
}, 10000);

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

describe.skip('User API Integration', () => {
  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: 'John', email: 'john@example.com' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.name).toBe('John');
      expect(res.body.data.email).toBe('john@example.com');
      expect(res.body.data._id).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      await request(app)
        .post('/api/users')
        .send({ name: 'John', email: 'john@example.com' });

      const res = await request(app)
        .post('/api/users')
        .send({ name: 'Jane', email: 'john@example.com' });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Email already exists');
    });
  });

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      await request(app)
        .post('/api/users')
        .send({ name: 'John', email: 'john@example.com' });
      await request(app)
        .post('/api/users')
        .send({ name: 'Jane', email: 'jane@example.com' });

      const res = await request(app).get('/api/users');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toHaveLength(2);
    });

    it('should filter users by email query', async () => {
      await request(app)
        .post('/api/users')
        .send({ name: 'John', email: 'john@example.com' });

      const res = await request(app).get('/api/users?email=john@example.com');

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('john@example.com');
    });

    it('should return 404 for non-existent email', async () => {
      const res = await request(app).get('/api/users?email=none@example.com');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/users/id/:id', () => {
    it('should return a user by ID', async () => {
      const createRes = await request(app)
        .post('/api/users')
        .send({ name: 'John', email: 'john@example.com' });

      const res = await request(app).get(`/api/users/id/${createRes.body.data._id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('John');
    });

    it('should return 404 for non-existent ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/users/id/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/users/email/:email', () => {
    it('should return a user by email', async () => {
      await request(app)
        .post('/api/users')
        .send({ name: 'John', email: 'john@example.com' });

      const res = await request(app).get('/api/users/email/john@example.com');

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('John');
    });

    it('should return 404 for non-existent email', async () => {
      const res = await request(app).get('/api/users/email/none@example.com');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update a user', async () => {
      const createRes = await request(app)
        .post('/api/users')
        .send({ name: 'John', email: 'john@example.com' });

      const res = await request(app)
        .put(`/api/users/${createRes.body.data._id}`)
        .send({ name: 'Jane', email: 'jane@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Jane');
      expect(res.body.data.email).toBe('jane@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/users/${fakeId}`)
        .send({ name: 'Jane' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/users/id/:id', () => {
    it('should delete a user by ID', async () => {
      const createRes = await request(app)
        .post('/api/users')
        .send({ name: 'John', email: 'john@example.com' });

      const res = await request(app).delete(`/api/users/id/${createRes.body.data._id}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User deleted successfully');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/users/id/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/users/email/:email', () => {
    it('should delete a user by email', async () => {
      await request(app)
        .post('/api/users')
        .send({ name: 'John', email: 'john@example.com' });

      const res = await request(app).delete('/api/users/email/john@example.com');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User deleted successfully');
    });

    it('should return 404 for non-existent email', async () => {
      const res = await request(app).delete('/api/users/email/none@example.com');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('Unknown routes', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown');

      expect(res.status).toBe(404);
    });
  });
});
