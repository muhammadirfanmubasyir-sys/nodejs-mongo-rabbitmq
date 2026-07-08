const errorHandler = require('../../middleware/errorHandler');
const { mockRequest, mockResponse } = require('../helpers/mockExpress');

describe('errorHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return statusCode and message for operational errors', () => {
    const err = { statusCode: 404, message: 'Not found', isOperational: true };
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Not found',
    });
  });

  it('should return 500 and generic message for non-operational errors', () => {
    const err = { statusCode: undefined, message: 'Something broke', isOperational: false };
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Internal server error',
    });
  });

  it('should log the error via req.log.error', () => {
    const err = { statusCode: 400, message: 'Bad request', isOperational: true };
    errorHandler(err, req, res, next);

    expect(req.log.error).toHaveBeenCalledWith({ err }, 'Bad request');
  });
});
