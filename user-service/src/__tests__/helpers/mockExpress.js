const mockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  method: 'GET',
  url: '/',
  originalUrl: '/',
  log: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
  ...overrides,
});

const mockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    on: jest.fn(),
  };
  return res;
};

const mockNext = jest.fn();

module.exports = { mockRequest, mockResponse, mockNext };
