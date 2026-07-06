const { getChannel } = require('../config/rabbitmq');
const config = require('../config');
const logger = require('../utils/logger');

const startConsumer = () => {
  const channel = getChannel();
  if (!channel) {
    logger.error('RabbitMQ channel not available, cannot start consumer');
    return;
  }

  channel.consume(
    config.queueName,
    (msg) => {
      if (!msg) return;

      try {
        const taskData = JSON.parse(msg.content.toString());
        logger.info(
          {
            taskId: taskData.taskId,
            userId: taskData.userId,
            title: taskData.title,
          },
          'New task notification received'
        );
        channel.ack(msg);
      } catch (err) {
        logger.error({ err }, 'Failed to process message');
        channel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );

  logger.info({ queue: config.queueName }, 'Consumer started, listening for messages');
};

module.exports = { startConsumer };
