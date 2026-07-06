require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3003,
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  queueName: process.env.QUEUE_NAME || 'task_queue',
  nodeEnv: process.env.NODE_ENV || 'development',
};
