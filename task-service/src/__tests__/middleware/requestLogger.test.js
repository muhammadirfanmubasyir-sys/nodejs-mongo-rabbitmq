jest.mock('pino-http', () => () => (req, res, next) => next());
jest.mock('../../utils/logger', () => ({}));

const requestLogger = require('../../middleware/requestLogger');

describe('requestLogger', () => {
  it('should be a middleware function', () => {
    expect(typeof requestLogger).toBe('function');
  });
});
