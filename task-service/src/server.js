const app = require('./app');
const config = require('./config');
const connectDB = require('./config/db');
const { connectRabbitMQ, closeConnection } = require('./config/rabbitmq');
const logger = require('./utils/logger');

const start = async () => {
  await connectDB();
  await connectRabbitMQ();

  const server = app.listen(config.port, () => {
    logger.info(`Task service running on port ${config.port}`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await closeConnection();
      const mongoose = require('mongoose');
      await mongoose.connection.close();
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
