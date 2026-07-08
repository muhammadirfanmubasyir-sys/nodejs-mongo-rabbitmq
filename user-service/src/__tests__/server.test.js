jest.mock('../config/db', () => jest.fn().mockResolvedValue());
jest.mock('../app', () => ({
  listen: jest.fn((port, cb) => {
    if (cb) cb();
    return {
      close: jest.fn((cb) => {
        if (cb) cb();
      }),
    };
  }),
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('server', () => {
  let originalOn, originalExit;

  beforeEach(() => {
    originalOn = process.on;
    originalExit = process.exit;
    process.on = jest.fn();
    process.exit = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.on = originalOn;
    process.exit = originalExit;
  });

  it('should start and register signal handlers', async () => {
    require('../server');

    const connectDB = require('../config/db');
    const app = require('../app');
    const config = require('../config');

    await new Promise(r => setTimeout(r, 50));

    expect(connectDB).toHaveBeenCalled();
    expect(app.listen).toHaveBeenCalledWith(config.port, expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
  });
});
