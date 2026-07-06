const amqp = require('amqplib');
const config = require('./index');
const logger = require('../utils/logger');

let channel = null;
let connection = null;

const connectRabbitMQ = async (retries = 5, delay = 3000) => {
  while (retries > 0) {
    try {
      connection = await amqp.connect(config.rabbitmqUrl);
      channel = await connection.createChannel();
      await channel.assertQueue(config.queueName, { durable: true });

      connection.on('error', (err) => {
        logger.error({ err }, 'RabbitMQ connection error');
        channel = null;
      });

      connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        channel = null;
      });

      logger.info('Connected to RabbitMQ');
      return channel;
    } catch (err) {
      retries--;
      logger.warn({ err, retriesLeft: retries }, 'Failed to connect to RabbitMQ, retrying...');
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  logger.error('Could not connect to RabbitMQ after multiple attempts');
  return null;
};

const getChannel = () => channel;

const sendToQueue = (queueName, message) => {
  if (!channel) {
    logger.error('RabbitMQ channel not available');
    return false;
  }
  return channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
};

const closeConnection = async () => {
  if (channel) await channel.close().catch(() => {});
  if (connection) await connection.close().catch(() => {});
  logger.info('RabbitMQ connection closed');
};

module.exports = { connectRabbitMQ, getChannel, sendToQueue, closeConnection };
