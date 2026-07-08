jest.mock('pino', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
  const pino = jest.fn(() => mockLogger);
  pino.stdTimeFunctions = { isoTime: jest.fn() };
  return pino;
});
jest.mock('../../config', () => ({
  nodeEnv: 'development',
}));

describe('logger', () => {
  it('should create a pino logger with debug level in development', () => {
    const pino = require('pino');
    const logger = require('../../utils/logger');

    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'debug',
      })
    );
    expect(logger).toBeDefined();
  });

  it('should use info level in production', () => {
    jest.resetModules();
    jest.mock('../../config', () => ({ nodeEnv: 'production' }));
    jest.mock('pino', () => {
      const mockLogger = { info: jest.fn() };
      const pino = jest.fn(() => mockLogger);
      pino.stdTimeFunctions = { isoTime: jest.fn() };
      return pino;
    });

    const pino = require('pino');
    require('../../utils/logger');

    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
      })
    );
  });
});
