jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));
jest.mock('../../models/User');
jest.mock('../../middleware/asyncHandler', () => (fn) => fn);

const User = require('../../models/User');
const { mockRequest, mockResponse } = require('../helpers/mockExpress');
const userController = require('../../controllers/userController');
const AppError = require('../../utils/AppError');

describe('userController', () => {
  let req, res, next;

  beforeEach(() => {
    next = jest.fn();
    res = mockResponse();
    req = mockRequest();
    User.create.mockReset();
    User.find.mockReset();
    User.findOne.mockReset();
    User.findById.mockReset();
    User.findByIdAndUpdate.mockReset();
    User.findByIdAndDelete.mockReset();
    User.findOneAndDelete.mockReset();
  });

  describe('createUser', () => {
    it('should create a user and return 201', async () => {
      req = mockRequest({ body: { name: 'John', email: 'john@example.com' } });
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ _id: '123', name: 'John', email: 'john@example.com' });

      await userController.createUser(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(User.create).toHaveBeenCalledWith({ name: 'John', email: 'john@example.com' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { _id: '123', name: 'John', email: 'john@example.com' },
      });
    });

    it('should return 409 if email already exists', async () => {
      req = mockRequest({ body: { name: 'John', email: 'existing@example.com' } });
      User.findOne.mockResolvedValue({ _id: '456', email: 'existing@example.com' });

      let error;
      try {
        await userController.createUser(req, res, next);
      } catch (err) {
        error = err;
      }

      expect(User.findOne).toHaveBeenCalledWith({ email: 'existing@example.com' });
      expect(res.status).not.toHaveBeenCalled();
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(409);
    });
  });

  describe('getUsers', () => {
    it('should return all users', async () => {
      const users = [{ _id: '1', name: 'John' }, { _id: '2', name: 'Jane' }];
      User.find.mockResolvedValue(users);

      await userController.getUsers(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ status: 'success', count: 2, data: users });
    });

    it('should return a user by email query param', async () => {
      req = mockRequest({ query: { email: 'john@example.com' } });
      User.findOne.mockResolvedValue({ _id: '1', name: 'John', email: 'john@example.com' });

      await userController.getUsers(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { _id: '1', name: 'John', email: 'john@example.com' },
      });
    });

    it('should return 404 if email query not found', async () => {
      req = mockRequest({ query: { email: 'none@example.com' } });
      User.findOne.mockResolvedValue(null);

      let error;
      try {
        await userController.getUsers(req, res, next);
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
    });
  });

  describe('getUserById', () => {
    it('should return a user by ID', async () => {
      req = mockRequest({ params: { id: '123' } });
      User.findById.mockResolvedValue({ _id: '123', name: 'John' });

      await userController.getUserById(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { _id: '123', name: 'John' },
      });
    });

    it('should return 404 if user not found', async () => {
      req = mockRequest({ params: { id: '999' } });
      User.findById.mockResolvedValue(null);

      let error;
      try {
        await userController.getUserById(req, res, next);
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
    });
  });

  describe('getUserByEmail', () => {
    it('should return a user by email', async () => {
      req = mockRequest({ params: { email: 'john@example.com' } });
      User.findOne.mockResolvedValue({ _id: '1', email: 'john@example.com' });

      await userController.getUserByEmail(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { _id: '1', email: 'john@example.com' },
      });
    });

    it('should return 404 if email not found', async () => {
      req = mockRequest({ params: { email: 'none@example.com' } });
      User.findOne.mockResolvedValue(null);

      let error;
      try {
        await userController.getUserByEmail(req, res, next);
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
    });
  });

  describe('updateUser', () => {
    it('should update and return the user', async () => {
      req = mockRequest({ params: { id: '123' }, body: { name: 'Jane', email: 'jane@example.com' } });
      User.findOne.mockResolvedValue(null);
      User.findByIdAndUpdate.mockResolvedValue({ _id: '123', name: 'Jane', email: 'jane@example.com' });

      await userController.updateUser(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: { _id: '123', name: 'Jane', email: 'jane@example.com' },
      });
    });

    it('should return 409 if email already exists for another user', async () => {
      req = mockRequest({ params: { id: '123' }, body: { email: 'taken@example.com' } });
      User.findOne.mockResolvedValue({ _id: '789', email: 'taken@example.com' });

      let error;
      try {
        await userController.updateUser(req, res, next);
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(409);
    });

    it('should return 404 if user not found', async () => {
      req = mockRequest({ params: { id: '999' }, body: { name: 'Jane' } });
      User.findOne.mockResolvedValue(null);
      User.findByIdAndUpdate.mockResolvedValue(null);

      let error;
      try {
        await userController.updateUser(req, res, next);
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
    });
  });

  describe('deleteUserById', () => {
    it('should delete and return success', async () => {
      req = mockRequest({ params: { id: '123' } });
      User.findByIdAndDelete.mockResolvedValue({ _id: '123' });

      await userController.deleteUserById(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ status: 'success', message: 'User deleted successfully' });
    });

    it('should return 404 if user not found', async () => {
      req = mockRequest({ params: { id: '999' } });
      User.findByIdAndDelete.mockResolvedValue(null);

      let error;
      try {
        await userController.deleteUserById(req, res, next);
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
    });
  });

  describe('deleteUserByEmail', () => {
    it('should delete and return success', async () => {
      req = mockRequest({ params: { email: 'john@example.com' } });
      User.findOneAndDelete.mockResolvedValue({ _id: '123' });

      await userController.deleteUserByEmail(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ status: 'success', message: 'User deleted successfully' });
    });

    it('should return 404 if email not found', async () => {
      req = mockRequest({ params: { email: 'none@example.com' } });
      User.findOneAndDelete.mockResolvedValue(null);

      let error;
      try {
        await userController.deleteUserByEmail(req, res, next);
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
    });
  });
});
