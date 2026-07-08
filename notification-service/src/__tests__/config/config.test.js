jest.mock('dotenv', () => ({ config: jest.fn() }));

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.PORT;
    delete process.env.RABBITMQ_URL;
    delete process.env.QUEUE_NAME;
    delete process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return default values when env vars are not set', () => {
    const config = require('../../config');
    expect(config.port).toBe(3003);
    expect(config.rabbitmqUrl).toBe('amqp://localhost:5672');
    expect(config.queueName).toBe('task_queue');
    expect(config.nodeEnv).toBe('development');
  });

  it('should use env vars when provided', () => {
    process.env.PORT = '4000';
    process.env.RABBITMQ_URL = 'amqp://rabbitmq:5672';
    process.env.QUEUE_NAME = 'custom_queue';
    process.env.NODE_ENV = 'production';

    const config = require('../../config');
    expect(config.port).toBe(4000);
    expect(config.rabbitmqUrl).toBe('amqp://rabbitmq:5672');
    expect(config.queueName).toBe('custom_queue');
    expect(config.nodeEnv).toBe('production');
  });

  it('should parse PORT as integer', () => {
    process.env.PORT = '8080';
    const config = require('../../config');
    expect(config.port).toBe(8080);
    expect(typeof config.port).toBe('number');
  });

  it('should fall back to default for invalid PORT', () => {
    process.env.PORT = 'invalid';
    const config = require('../../config');
    expect(config.port).toBe(3003);
  });
});
