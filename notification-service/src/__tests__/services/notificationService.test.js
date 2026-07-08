jest.mock('../../config/rabbitmq');

const rabbitmq = require('../../config/rabbitmq');
const { startConsumer } = require('../../services/notificationService');

describe('notificationService', () => {
  let mockChannel;

  beforeEach(() => {
    jest.clearAllMocks();
    mockChannel = {
      consume: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn(),
    };
    rabbitmq.getChannel.mockReturnValue(mockChannel);
  });

  it('should start consumer and listen on task_queue', () => {
    startConsumer();

    expect(mockChannel.consume).toHaveBeenCalledWith(
      'task_queue',
      expect.any(Function),
      { noAck: false }
    );
  });

  it('should log and ack valid messages', () => {
    startConsumer();

    const consumeCallback = mockChannel.consume.mock.calls[0][1];
    const msg = {
      content: Buffer.from(JSON.stringify({
        taskId: 'task123',
        userId: 'user123',
        title: 'Test Task',
      })),
    };

    consumeCallback(msg);

    expect(mockChannel.ack).toHaveBeenCalledWith(msg);
  });

  it('should nack invalid JSON messages', () => {
    startConsumer();

    const consumeCallback = mockChannel.consume.mock.calls[0][1];
    const msg = {
      content: Buffer.from('invalid json{{{'),
    };

    consumeCallback(msg);

    expect(mockChannel.nack).toHaveBeenCalledWith(msg, false, false);
    expect(mockChannel.ack).not.toHaveBeenCalled();
  });

  it('should do nothing if channel is null', () => {
    rabbitmq.getChannel.mockReturnValue(null);

    startConsumer();

    expect(mockChannel.consume).not.toHaveBeenCalled();
  });

  it('should handle null message from consume', () => {
    startConsumer();

    const consumeCallback = mockChannel.consume.mock.calls[0][1];
    consumeCallback(null);

    expect(mockChannel.ack).not.toHaveBeenCalled();
    expect(mockChannel.nack).not.toHaveBeenCalled();
  });
});
