require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3002,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/task-service',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  queueName: process.env.QUEUE_NAME || 'task_queue',
  nodeEnv: process.env.NODE_ENV || 'development',
};
