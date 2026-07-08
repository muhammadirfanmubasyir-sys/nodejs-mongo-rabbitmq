jest.mock('pino', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  const pinoFn = jest.fn(() => mockLogger);
  pinoFn.stdTimeFunctions = { isoTime: jest.fn() };
  return pinoFn;
});

jest.mock('../../config', () => ({
  nodeEnv: 'development',
}));

describe('logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should create a pino logger', () => {
    const pino = require('pino');
    require('../../utils/logger');
    expect(pino).toHaveBeenCalled();
  });

  it('should configure debug level in development', () => {
    jest.doMock('../../config', () => ({ nodeEnv: 'development' }));
    const pino = require('pino');
    require('../../utils/logger');
    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({ level: 'debug' })
    );
  });

  it('should configure info level in production', () => {
    jest.doMock('../../config', () => ({ nodeEnv: 'production' }));
    const pino = require('pino');
    require('../../utils/logger');
    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({ level: 'info' })
    );
  });

  it('should include transport in non-production', () => {
    jest.doMock('../../config', () => ({ nodeEnv: 'development' }));
    const pino = require('pino');
    require('../../utils/logger');
    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({
        transport: { target: 'pino/file', options: { destination: 1 } },
      })
    );
  });

  it('should not include transport in production', () => {
    jest.doMock('../../config', () => ({ nodeEnv: 'production' }));
    const pino = require('pino');
    require('../../utils/logger');
    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({ transport: undefined })
    );
  });
});
