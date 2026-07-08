const AppError = require('../../utils/AppError');

describe('AppError', () => {
  it('should create an error with message and statusCode', () => {
    const err = new AppError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.isOperational).toBe(true);
  });

  it('should be an instance of Error', () => {
    const err = new AppError('Bad request', 400);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it('should capture stack trace', () => {
    const err = new AppError('Server error', 500);
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain('AppError');
  });
});
