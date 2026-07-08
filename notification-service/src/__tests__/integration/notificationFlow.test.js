jest.mock('amqplib');
jest.mock('../../config/rabbitmq');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const rabbitmq = require('../../config/rabbitmq');
const logger = require('../../utils/logger');
const { startConsumer } = require('../../services/notificationService');

describe('Notification Flow Integration', () => {
  let mockChannel;
  let consumeCallback;

  beforeEach(() => {
    jest.clearAllMocks();
    mockChannel = {
      consume: jest.fn((queue, callback, options) => {
        consumeCallback = callback;
      }),
      ack: jest.fn(),
      nack: jest.fn(),
    };
    rabbitmq.getChannel.mockReturnValue(mockChannel);
  });

  it('should process a valid task notification end-to-end', () => {
    startConsumer();

    const taskData = {
      taskId: 'task-001',
      userId: 'user-001',
      title: 'Review PR',
      description: 'Please review the open PR',
    };

    const msg = {
      content: Buffer.from(JSON.stringify(taskData)),
    };

    consumeCallback(msg);

    expect(mockChannel.consume).toHaveBeenCalledWith(
      'task_queue',
      expect.any(Function),
      { noAck: false }
    );
    expect(mockChannel.ack).toHaveBeenCalledWith(msg);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-001',
        userId: 'user-001',
        title: 'Review PR',
      }),
      'New task notification received'
    );
  });

  it('should handle multiple valid messages sequentially', () => {
    startConsumer();

    const messages = [
      { taskId: 'task-1', userId: 'user-1', title: 'Task 1' },
      { taskId: 'task-2', userId: 'user-2', title: 'Task 2' },
      { taskId: 'task-3', userId: 'user-3', title: 'Task 3' },
    ];

    messages.forEach((data) => {
      const msg = { content: Buffer.from(JSON.stringify(data)) };
      consumeCallback(msg);
    });

    expect(mockChannel.ack).toHaveBeenCalledTimes(3);
    expect(mockChannel.nack).not.toHaveBeenCalled();
  });

  it('should ack valid message and nack invalid message in sequence', () => {
    startConsumer();

    const validMsg = {
      content: Buffer.from(JSON.stringify({ taskId: 't1', userId: 'u1', title: 'Good' })),
    };
    const invalidMsg = {
      content: Buffer.from('not json'),
    };

    consumeCallback(validMsg);
    consumeCallback(invalidMsg);

    expect(mockChannel.ack).toHaveBeenCalledTimes(1);
    expect(mockChannel.ack).toHaveBeenCalledWith(validMsg);
    expect(mockChannel.nack).toHaveBeenCalledTimes(1);
    expect(mockChannel.nack).toHaveBeenCalledWith(invalidMsg, false, false);
  });

  it('should skip null messages without ack/nack', () => {
    startConsumer();
    consumeCallback(null);

    expect(mockChannel.ack).not.toHaveBeenCalled();
    expect(mockChannel.nack).not.toHaveBeenCalled();
  });

  it('should nack message with empty buffer content as invalid JSON', () => {
    startConsumer();
    const msg = { content: Buffer.from('') };

    consumeCallback(msg);

    expect(mockChannel.nack).toHaveBeenCalledWith(msg, false, false);
    expect(mockChannel.ack).not.toHaveBeenCalled();
  });

  it('should handle message with missing expected fields', () => {
    startConsumer();
    const msg = {
      content: Buffer.from(JSON.stringify({ someField: 'value' })),
    };

    consumeCallback(msg);

    expect(mockChannel.ack).toHaveBeenCalledWith(msg);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: undefined, userId: undefined, title: undefined }),
      'New task notification received'
    );
  });
});
