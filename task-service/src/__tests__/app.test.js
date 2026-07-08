jest.mock('helmet', () => () => (req, res, next) => next());
jest.mock('cors', () => () => (req, res, next) => next());
jest.mock('express-rate-limit', () => () => (req, res, next) => next());
jest.mock('../middleware/requestLogger', () => (req, res, next) => next());
jest.mock('../middleware/errorHandler', () => (err, req, res, next) => {
  res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
});
jest.mock('../routes/taskRoutes', () => {
  const express = require('express');
  const router = express.Router();
  router.get('/test', (req, res) => res.json({ ok: true }));
  return router;
});

const mockGetChannel = jest.fn().mockReturnValue({});
jest.mock('../config/rabbitmq', () => ({
  getChannel: mockGetChannel,
}));

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');

describe('app', () => {
  beforeEach(() => {
    mongoose.connection.readyState = 1;
    mockGetChannel.mockReturnValue({});
  });

  it('GET /health should return healthy when all services are up', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.checks.mongodb).toBe('up');
    expect(res.body.checks.rabbitmq).toBe('up');
  });

  it('GET /health should return degraded when rabbitmq is down', async () => {
    mockGetChannel.mockReturnValue(null);
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('degraded');
    expect(res.body.checks.rabbitmq).toBe('down');
  });

  it('GET /health should return 503 when mongodb is down', async () => {
    mongoose.connection.readyState = 0;
    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.checks.mongodb).toBe('down');
  });

  it('GET /unknown should return 404', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
  });

  it('should handle errors via errorHandler', async () => {
    const res = await request(app).get('/api/tasks/nonexistent-route');
    expect(res.status).toBe(404);
  });
});
