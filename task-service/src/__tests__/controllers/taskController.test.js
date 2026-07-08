jest.mock('../../config', () => ({ queueName: 'task_queue' }));
jest.mock('../../config/rabbitmq');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));
jest.mock('../../models/Task');
jest.mock('../../middleware/asyncHandler', () => (fn) => fn);

const Task = require('../../models/Task');
const rabbitmq = require('../../config/rabbitmq');
const { mockRequest, mockResponse } = require('../helpers/mockExpress');
const taskController = require('../../controllers/taskController');
const AppError = require('../../utils/AppError');

describe('taskController', () => {
  let req, res, next;

  beforeEach(() => {
    next = jest.fn();
    res = mockResponse();
    req = mockRequest();
    Task.create.mockReset();
    Task.find.mockReset();
    Task.findById.mockReset();
    rabbitmq.getChannel.mockReset();
    rabbitmq.sendToQueue.mockReset();
  });

  describe('createTask', () => {
    it('should create a task and publish to queue', async () => {
      req = mockRequest({
        body: { title: 'My Task', description: 'Do something', userId: 'user123' },
      });
      const task = { _id: 'task123', title: 'My Task', description: 'Do something', userId: 'user123' };
      Task.create.mockResolvedValue(task);
      rabbitmq.getChannel.mockReturnValue({});
      rabbitmq.sendToQueue.mockReturnValue(true);

      await taskController.createTask(req, res, next);

      expect(Task.create).toHaveBeenCalledWith({
        title: 'My Task',
        description: 'Do something',
        userId: 'user123',
      });
      expect(rabbitmq.sendToQueue).toHaveBeenCalledWith(
        'task_queue',
        expect.objectContaining({ taskId: 'task123', title: 'My Task' })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ status: 'success', data: task });
    });

    it('should create task even if RabbitMQ channel is unavailable', async () => {
      req = mockRequest({
        body: { title: 'My Task', description: 'Do something', userId: 'user123' },
      });
      Task.create.mockResolvedValue({ _id: 'task123', title: 'My Task' });
      rabbitmq.getChannel.mockReturnValue(null);

      await taskController.createTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(rabbitmq.sendToQueue).not.toHaveBeenCalled();
    });

    it('should warn if sendToQueue returns false', async () => {
      req = mockRequest({
        body: { title: 'My Task', description: 'Do something', userId: 'user123' },
      });
      Task.create.mockResolvedValue({ _id: 'task123', title: 'My Task' });
      rabbitmq.getChannel.mockReturnValue({});
      rabbitmq.sendToQueue.mockReturnValue(false);

      await taskController.createTask(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getTasks', () => {
    it('should return all tasks', async () => {
      const tasks = [{ _id: '1', title: 'Task 1' }, { _id: '2', title: 'Task 2' }];
      Task.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(tasks) });

      await taskController.getTasks(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ status: 'success', count: 2, data: tasks });
    });
  });

  describe('getTaskById', () => {
    it('should return a task by ID', async () => {
      req = mockRequest({ params: { id: 'task123' } });
      Task.findById.mockResolvedValue({ _id: 'task123', title: 'My Task' });

      await taskController.getTaskById(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { _id: 'task123', title: 'My Task' },
      });
    });

    it('should return 404 if task not found', async () => {
      req = mockRequest({ params: { id: '999' } });
      Task.findById.mockResolvedValue(null);

      let error;
      try {
        await taskController.getTaskById(req, res, next);
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
    });
  });
});
