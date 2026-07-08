jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    on: jest.fn(),
  },
}));
jest.mock('../../config', () => ({
  mongoUri: 'mongodb://localhost:27017/task-service',
}));
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const mongoose = require('mongoose');
const connectDB = require('../../config/db');
const logger = require('../../utils/logger');

describe('connectDB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    process.exit.mockRestore();
  });

  it('should connect to MongoDB successfully', async () => {
    mongoose.connect.mockResolvedValue();

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/task-service');
    expect(logger.info).toHaveBeenCalledWith('Connected to MongoDB');
    expect(mongoose.connection.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mongoose.connection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
  });

  it('should log error and exit on connection failure', async () => {
    const error = new Error('Connection failed');
    mongoose.connect.mockRejectedValue(error);

    await connectDB();

    expect(logger.error).toHaveBeenCalledWith({ err: error }, 'Failed to connect to MongoDB');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should log error on MongoDB connection error event', async () => {
    mongoose.connect.mockResolvedValue();
    let errorHandler;
    mongoose.connection.on.mockImplementation((event, cb) => {
      if (event === 'error') errorHandler = cb;
    });

    await connectDB();

    const dbError = new Error('DB error');
    errorHandler(dbError);
    expect(logger.error).toHaveBeenCalledWith({ err: dbError }, 'MongoDB connection error');
  });

  it('should log warning on MongoDB disconnected event', async () => {
    mongoose.connect.mockResolvedValue();
    let disconnectedHandler;
    mongoose.connection.on.mockImplementation((event, cb) => {
      if (event === 'disconnected') disconnectedHandler = cb;
    });

    await connectDB();

    disconnectedHandler();
    expect(logger.warn).toHaveBeenCalledWith('MongoDB disconnected');
  });
});
