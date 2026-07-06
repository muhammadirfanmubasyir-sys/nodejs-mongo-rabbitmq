const express = require('express');
const helmet = require('helmet');
const config = require('./config');
const { connectRabbitMQ, closeConnection } = require('./config/rabbitmq');
const { startConsumer } = require('./services/notificationService');
const logger = require('./utils/logger');

const app = express();
app.use(helmet());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service', timestamp: new Date().toISOString() });
});

const start = async () => {
  const channel = await connectRabbitMQ();
  if (!channel) {
    logger.error('Failed to connect to RabbitMQ. Exiting.');
    process.exit(1);
  }

  startConsumer();

  const server = app.listen(config.port, () => {
    logger.info(`Notification service running on port ${config.port}`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await closeConnection();
      logger.info('All connections closed.');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start();
