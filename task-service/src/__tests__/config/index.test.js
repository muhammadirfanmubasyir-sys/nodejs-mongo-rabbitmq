jest.mock('dotenv', () => ({ config: jest.fn() }));

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return default values when env vars are not set', () => {
    delete process.env.PORT;
    delete process.env.MONGO_URI;
    delete process.env.RABBITMQ_URL;
    delete process.env.QUEUE_NAME;
    delete process.env.NODE_ENV;

    const config = require('../../config');
    expect(config.port).toBe(3002);
    expect(config.mongoUri).toBe('mongodb://localhost:27017/task-service');
    expect(config.rabbitmqUrl).toBe('amqp://localhost:5672');
    expect(config.queueName).toBe('task_queue');
    expect(config.nodeEnv).toBe('development');
  });

  it('should use environment variables when set', () => {
    process.env.PORT = '4000';
    process.env.MONGO_URI = 'mongodb://custom:27017/test';
    process.env.RABBITMQ_URL = 'amqp://custom:5672';
    process.env.QUEUE_NAME = 'custom_queue';
    process.env.NODE_ENV = 'production';

    const config = require('../../config');
    expect(config.port).toBe(4000);
    expect(config.mongoUri).toBe('mongodb://custom:27017/test');
    expect(config.rabbitmqUrl).toBe('amqp://custom:5672');
    expect(config.queueName).toBe('custom_queue');
    expect(config.nodeEnv).toBe('production');
  });
});
