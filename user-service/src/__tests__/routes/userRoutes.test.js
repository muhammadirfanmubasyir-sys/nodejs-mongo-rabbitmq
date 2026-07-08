jest.mock('../../controllers/userController', () => ({
  getUsers: jest.fn((req, res) => res.json({ status: 'success' })),
  createUser: jest.fn((req, res) => res.status(201).json({ status: 'success' })),
  getUserById: jest.fn((req, res) => res.json({ status: 'success' })),
  getUserByEmail: jest.fn((req, res) => res.json({ status: 'success' })),
  updateUser: jest.fn((req, res) => res.json({ status: 'success' })),
  deleteUserById: jest.fn((req, res) => res.json({ status: 'success' })),
  deleteUserByEmail: jest.fn((req, res) => res.json({ status: 'success' })),
}));

const express = require('express');
const request = require('supertest');
const app = express();

jest.mock('../../middleware/requestLogger', () => (req, res, next) => next());
jest.mock('../../middleware/errorHandler', () => (err, req, res, next) => {
  res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
});

const userRoutes = require('../../routes/userRoutes');
app.use(express.json());
app.use('/api/users', userRoutes);

describe('userRoutes', () => {
  it('GET /api/users should call getUsers', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
  });

  it('POST /api/users should call createUser', async () => {
    const res = await request(app).post('/api/users').send({ name: 'John', email: 'john@test.com' });
    expect(res.status).toBe(201);
  });

  it('GET /api/users/id/:id should call getUserById', async () => {
    const res = await request(app).get('/api/users/id/123');
    expect(res.status).toBe(200);
  });

  it('GET /api/users/email/:email should call getUserByEmail', async () => {
    const res = await request(app).get('/api/users/email/john@test.com');
    expect(res.status).toBe(200);
  });

  it('PUT /api/users/:id should call updateUser', async () => {
    const res = await request(app).put('/api/users/123').send({ name: 'Jane' });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/users/id/:id should call deleteUserById', async () => {
    const res = await request(app).delete('/api/users/id/123');
    expect(res.status).toBe(200);
  });

  it('DELETE /api/users/email/:email should call deleteUserByEmail', async () => {
    const res = await request(app).delete('/api/users/email/john@test.com');
    expect(res.status).toBe(200);
  });
});
