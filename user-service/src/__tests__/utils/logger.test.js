jest.mock('../../config', () => ({
  nodeEnv: 'development',
}));

jest.mock('pino', () => {
  let capturedOptions = null;
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
  const pino = jest.fn((opts) => {
    capturedOptions = opts;
    return mockLogger;
  });
  pino.stdTimeFunctions = { isoTime: jest.fn() };
  pino._getCapturedOptions = () => capturedOptions;
  return pino;
});

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

  it('should use the level formatter to format level labels', () => {
    const pino = require('pino');
    require('../../utils/logger');

    const opts = pino._getCapturedOptions();
    expect(opts.formatters).toBeDefined();
    expect(typeof opts.formatters.level).toBe('function');

    const result = opts.formatters.level('info');
    expect(result).toEqual({ level: 'info' });
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
