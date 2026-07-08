jest.mock('../../controllers/taskController', () => ({
  getTasks: jest.fn((req, res) => res.json({ status: 'success' })),
  createTask: jest.fn((req, res) => res.status(201).json({ status: 'success' })),
  getTaskById: jest.fn((req, res) => res.json({ status: 'success' })),
}));

const express = require('express');
const request = require('supertest');
const app = express();

jest.mock('../../middleware/requestLogger', () => (req, res, next) => next());
jest.mock('../../middleware/errorHandler', () => (err, req, res, next) => {
  res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
});

const taskRoutes = require('../../routes/taskRoutes');
app.use(express.json());
app.use('/api/tasks', taskRoutes);

describe('taskRoutes', () => {
  it('GET /api/tasks should call getTasks', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
  });

  it('POST /api/tasks should call createTask', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Test' });
    expect(res.status).toBe(201);
  });

  it('GET /api/tasks/:id should call getTaskById', async () => {
    const res = await request(app).get('/api/tasks/123');
    expect(res.status).toBe(200);
  });
});
