jest.mock('amqplib', () => ({
  connect: jest.fn(),
}));
jest.mock('../../config', () => ({
  rabbitmqUrl: 'amqp://localhost:5672',
  queueName: 'task_queue',
}));
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const amqp = require('amqplib');
const logger = require('../../utils/logger');

let mockChannel, mockConnection;
let connectRabbitMQ, getChannel, sendToQueue, closeConnection;

describe('rabbitmq', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockChannel = {
      assertQueue: jest.fn().mockResolvedValue(),
      sendToQueue: jest.fn().mockReturnValue(true),
      close: jest.fn().mockResolvedValue(),
    };

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(),
    };

    const rabbitmq = require('../../config/rabbitmq');
    connectRabbitMQ = rabbitmq.connectRabbitMQ;
    getChannel = rabbitmq.getChannel;
    sendToQueue = rabbitmq.sendToQueue;
    closeConnection = rabbitmq.closeConnection;
  });

  describe('connectRabbitMQ', () => {
    it('should connect and return channel on success', async () => {
      amqp.connect.mockResolvedValue(mockConnection);

      const result = await connectRabbitMQ();

      expect(amqp.connect).toHaveBeenCalledWith('amqp://localhost:5672');
      expect(mockConnection.createChannel).toHaveBeenCalled();
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('task_queue', { durable: true });
      expect(result).toBe(mockChannel);
      expect(logger.info).toHaveBeenCalledWith('Connected to RabbitMQ');
    });

    it('should register connection event handlers', async () => {
      amqp.connect.mockResolvedValue(mockConnection);

      await connectRabbitMQ();

      expect(mockConnection.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockConnection.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should handle connection error event', async () => {
      amqp.connect.mockResolvedValue(mockConnection);
      let errorHandler;
      mockConnection.on.mockImplementation((event, cb) => {
        if (event === 'error') errorHandler = cb;
      });

      await connectRabbitMQ();

      const err = new Error('conn error');
      errorHandler(err);
      expect(logger.error).toHaveBeenCalledWith({ err }, 'RabbitMQ connection error');
    });

    it('should handle connection close event', async () => {
      amqp.connect.mockResolvedValue(mockConnection);
      let closeHandler;
      mockConnection.on.mockImplementation((event, cb) => {
        if (event === 'close') closeHandler = cb;
      });

      await connectRabbitMQ();

      closeHandler();
      expect(logger.warn).toHaveBeenCalledWith('RabbitMQ connection closed');
    });

    it('should retry on failure and eventually return null', async () => {
      amqp.connect.mockRejectedValue(new Error('connect failed'));

      const result = await connectRabbitMQ(2, 0);

      expect(amqp.connect).toHaveBeenCalledTimes(2);
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith('Could not connect to RabbitMQ after multiple attempts');
    }, 10000);

    it('should log retry attempts', async () => {
      amqp.connect.mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce(mockConnection);

      await connectRabbitMQ(2, 0);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ retriesLeft: 1 }),
        'Failed to connect to RabbitMQ, retrying...'
      );
    }, 10000);
  });

  describe('getChannel', () => {
    it('should return channel after successful connection', async () => {
      amqp.connect.mockResolvedValue(mockConnection);
      await connectRabbitMQ();
      expect(getChannel()).toBe(mockChannel);
    });
  });

  describe('sendToQueue', () => {
    it('should send message to queue when channel is available', async () => {
      amqp.connect.mockResolvedValue(mockConnection);
      await connectRabbitMQ();

      const result = sendToQueue('task_queue', { taskId: '123' });

      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'task_queue',
        Buffer.from(JSON.stringify({ taskId: '123' })),
        { persistent: true }
      );
      expect(result).toBe(true);
    });
  });

  describe('closeConnection', () => {
    it('should close channel and connection', async () => {
      amqp.connect.mockResolvedValue(mockConnection);
      await connectRabbitMQ();

      await closeConnection();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('RabbitMQ connection closed');
    });

    it('should handle close errors gracefully', async () => {
      amqp.connect.mockResolvedValue(mockConnection);
      await connectRabbitMQ();
      mockChannel.close.mockRejectedValue(new Error('close fail'));
      mockConnection.close.mockRejectedValue(new Error('close fail'));

      await closeConnection();

      expect(logger.info).toHaveBeenCalledWith('RabbitMQ connection closed');
    });
  });
});

describe('rabbitmq - fresh module', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('sendToQueue should return false when channel is not available', () => {
    const rabbitmq = require('../../config/rabbitmq');
    expect(rabbitmq.sendToQueue('queue', { data: 1 })).toBe(false);
  });

  it('getChannel should return null when not connected', () => {
    const rabbitmq = require('../../config/rabbitmq');
    expect(rabbitmq.getChannel()).toBeNull();
  });
});
