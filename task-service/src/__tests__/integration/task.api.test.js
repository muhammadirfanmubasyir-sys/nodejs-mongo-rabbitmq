jest.mock('../../config/rabbitmq', () => ({
  getChannel: jest.fn(),
  sendToQueue: jest.fn(),
}));

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const rabbitmq = require('../../config/rabbitmq');
const app = require('../../app');

let mongoServer;

const TIMEOUT = 120000;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  rabbitmq.getChannel.mockReturnValue({});
  rabbitmq.sendToQueue.mockReturnValue(true);
}, TIMEOUT);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
}, TIMEOUT);

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
  jest.clearAllMocks();
  rabbitmq.getChannel.mockReturnValue({});
});

describe.skip('Task API Integration', () => {
  describe('POST /api/tasks', () => {
    it('should create a task and publish to queue', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'My Task', description: 'Do something', userId: 'user123' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.title).toBe('My Task');
      expect(res.body.data.userId).toBe('user123');
      expect(rabbitmq.sendToQueue).toHaveBeenCalledWith(
        'task_queue',
        expect.objectContaining({ title: 'My Task' })
      );
    });

    it('should return error for missing title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ description: 'Do something', userId: 'user123' });

      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/tasks', () => {
    it('should return all tasks', async () => {
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Task 1', description: 'Desc 1', userId: 'user1' });
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Task 2', description: 'Desc 2', userId: 'user2' });

      const res = await request(app).get('/api/tasks');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return a task by ID', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .send({ title: 'My Task', description: 'Desc', userId: 'user123' });

      const res = await request(app).get(`/api/tasks/${createRes.body.data._id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('My Task');
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/tasks/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /health', () => {
    it('should return health status with RabbitMQ check', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.checks.mongodb).toBe('up');
      expect(res.body.checks.rabbitmq).toBe('up');
    });
  });
});
