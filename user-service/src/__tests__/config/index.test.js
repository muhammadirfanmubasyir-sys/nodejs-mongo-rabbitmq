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
    delete process.env.NODE_ENV;

    const config = require('../../config');
    expect(config.port).toBe(3001);
    expect(config.mongoUri).toBe('mongodb://localhost:27017/user-service');
    expect(config.nodeEnv).toBe('development');
  });

  it('should use environment variables when set', () => {
    process.env.PORT = '4000';
    process.env.MONGO_URI = 'mongodb://custom:27017/test';
    process.env.NODE_ENV = 'production';

    const config = require('../../config');
    expect(config.port).toBe(4000);
    expect(config.mongoUri).toBe('mongodb://custom:27017/test');
    expect(config.nodeEnv).toBe('production');
  });
});
