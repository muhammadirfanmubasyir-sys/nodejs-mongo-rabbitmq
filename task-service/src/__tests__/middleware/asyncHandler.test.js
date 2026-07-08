const asyncHandler = require('../../middleware/asyncHandler');

describe('asyncHandler', () => {
  it('should call the wrapped function', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const handler = asyncHandler(fn);
    const req = {};
    const res = {};
    const next = jest.fn();

    await handler(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with error if wrapped function rejects', async () => {
    const error = new Error('test error');
    const fn = jest.fn().mockRejectedValue(error);
    const handler = asyncHandler(fn);
    const req = {};
    const res = {};
    const next = jest.fn();

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('should call next with error if wrapped function throws synchronously', async () => {
    const error = new Error('sync error');
    const fn = jest.fn().mockImplementation(() => { throw error; });
    const handler = asyncHandler(fn);
    const req = {};
    const res = {};
    const next = jest.fn();

    handler(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
