jest.mock('amqplib');
jest.mock('../../config', () => ({
  rabbitmqUrl: 'amqp://localhost:5672',
  queueName: 'test_queue',
}));
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const amqp = require('amqplib');
const logger = require('../../utils/logger');

describe('rabbitmq config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getChannel', () => {
    it('should return null initially', () => {
      const rabbitmq = require('../../config/rabbitmq');
      expect(rabbitmq.getChannel()).toBeNull();
    });
  });

  describe('connectRabbitMQ', () => {
    let rabbitmq;

    beforeEach(() => {
      rabbitmq = require('../../config/rabbitmq');
    });

    it('should connect and return channel on success', async () => {
      const mockChannel = {
        assertQueue: jest.fn().mockResolvedValue({}),
        prefetch: jest.fn().mockResolvedValue({}),
      };
      const mockConnection = {
        createChannel: jest.fn().mockResolvedValue(mockChannel),
        on: jest.fn(),
      };
      amqp.connect.mockResolvedValue(mockConnection);

      const channel = await rabbitmq.connectRabbitMQ();

      expect(amqp.connect).toHaveBeenCalledWith('amqp://localhost:5672');
      expect(mockConnection.createChannel).toHaveBeenCalled();
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('test_queue', { durable: true });
      expect(mockChannel.prefetch).toHaveBeenCalledWith(1);
      expect(channel).toBe(mockChannel);
      expect(logger.info).toHaveBeenCalledWith('Connected to RabbitMQ');
    });

    it('should register connection error and close handlers', async () => {
      const mockChannel = {
        assertQueue: jest.fn().mockResolvedValue({}),
        prefetch: jest.fn().mockResolvedValue({}),
      };
      const mockConnection = {
        createChannel: jest.fn().mockResolvedValue(mockChannel),
        on: jest.fn(),
      };
      amqp.connect.mockResolvedValue(mockConnection);

      await rabbitmq.connectRabbitMQ();

      expect(mockConnection.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockConnection.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should handle connection error event', async () => {
      const mockChannel = {
        assertQueue: jest.fn().mockResolvedValue({}),
        prefetch: jest.fn().mockResolvedValue({}),
      };
      const mockConnection = {
        createChannel: jest.fn().mockResolvedValue(mockChannel),
        on: jest.fn(),
      };
      amqp.connect.mockResolvedValue(mockConnection);

      await rabbitmq.connectRabbitMQ();

      const errorHandler = mockConnection.on.mock.calls.find(([event]) => event === 'error')[1];
      errorHandler(new Error('connection lost'));

      expect(logger.error).toHaveBeenCalledWith(
        { err: new Error('connection lost') },
        'RabbitMQ connection error'
      );
      expect(rabbitmq.getChannel()).toBeNull();
    });

    it('should handle connection close event and reconnect', async () => {
      const mockChannel = {
        assertQueue: jest.fn().mockResolvedValue({}),
        prefetch: jest.fn().mockResolvedValue({}),
      };
      const mockConnection = {
        createChannel: jest.fn().mockResolvedValue(mockChannel),
        on: jest.fn(),
      };
      amqp.connect.mockResolvedValue(mockConnection);

      await rabbitmq.connectRabbitMQ();

      const closeHandler = mockConnection.on.mock.calls.find(([event]) => event === 'close')[1];
      closeHandler();

      expect(logger.warn).toHaveBeenCalledWith('RabbitMQ connection closed, attempting reconnect...');
      expect(rabbitmq.getChannel()).toBeNull();
    });

    it('should retry on connection failure', async () => {
      const rabbitmq = require('../../config/rabbitmq');
      amqp.connect
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValueOnce({
          createChannel: jest.fn().mockResolvedValue({
            assertQueue: jest.fn().mockResolvedValue({}),
            prefetch: jest.fn().mockResolvedValue({}),
          }),
          on: jest.fn(),
        });

      const promise = rabbitmq.connectRabbitMQ(2, 1000);

      await jest.advanceTimersByTimeAsync(1000);
      const channel = await promise;

      expect(amqp.connect).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ retriesLeft: 1 }),
        expect.stringContaining('Failed to connect')
      );
    });

    it('should exit process after all retries exhausted', async () => {
      const rabbitmq = require('../../config/rabbitmq');
      amqp.connect.mockRejectedValue(new Error('ECONNREFUSED'));
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

      const promise = rabbitmq.connectRabbitMQ(2, 1000);

      await jest.advanceTimersByTimeAsync(2000);
      await promise;

      expect(logger.error).toHaveBeenCalledWith(
        'Could not connect to RabbitMQ after multiple attempts. Exiting.'
      );
      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
  });

  describe('closeConnection', () => {
    it('should close channel and connection', async () => {
      const rabbitmq = require('../../config/rabbitmq');
      const mockChannel = {
        assertQueue: jest.fn().mockResolvedValue({}),
        prefetch: jest.fn().mockResolvedValue({}),
        close: jest.fn().mockResolvedValue({}),
      };
      const mockConnection = {
        createChannel: jest.fn().mockResolvedValue(mockChannel),
        on: jest.fn(),
        close: jest.fn().mockResolvedValue({}),
      };
      amqp.connect.mockResolvedValue(mockConnection);

      await rabbitmq.connectRabbitMQ();
      await rabbitmq.closeConnection();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('RabbitMQ connection closed');
    });

    it('should handle close errors gracefully', async () => {
      const rabbitmq = require('../../config/rabbitmq');
      const mockChannel = {
        assertQueue: jest.fn().mockResolvedValue({}),
        prefetch: jest.fn().mockResolvedValue({}),
        close: jest.fn().mockRejectedValue(new Error('Already closed')),
      };
      const mockConnection = {
        createChannel: jest.fn().mockResolvedValue(mockChannel),
        on: jest.fn(),
        close: jest.fn().mockRejectedValue(new Error('Already closed')),
      };
      amqp.connect.mockResolvedValue(mockConnection);

      await rabbitmq.connectRabbitMQ();
      await expect(rabbitmq.closeConnection()).resolves.not.toThrow();
    });

    it('should handle null channel and connection gracefully', async () => {
      const rabbitmq = require('../../config/rabbitmq');
      await expect(rabbitmq.closeConnection()).resolves.not.toThrow();
    });
  });
});
