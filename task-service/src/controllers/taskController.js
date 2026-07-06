const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const { sendToQueue, getChannel } = require('../config/rabbitmq');
const config = require('../config');
const logger = require('../utils/logger');

exports.createTask = asyncHandler(async (req, res) => {
  const { title, description, userId } = req.body;
  const task = await Task.create({ title, description, userId });

  const channel = getChannel();
  if (channel) {
    const message = { taskId: task._id, userId, title, description };
    const sent = sendToQueue(config.queueName, message);
    if (sent) {
      logger.info({ taskId: task._id }, 'Task published to queue');
    } else {
      logger.warn({ taskId: task._id }, 'Failed to publish task to queue');
    }
  } else {
    logger.warn({ taskId: task._id }, 'RabbitMQ channel unavailable, message not sent');
  }

  res.status(201).json({ status: 'success', data: task });
});

exports.getTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find().sort({ createdAt: -1 });
  res.json({ status: 'success', count: tasks.length, data: tasks });
});

exports.getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw new AppError('Task not found', 404);
  }
  res.json({ status: 'success', data: task });
});
