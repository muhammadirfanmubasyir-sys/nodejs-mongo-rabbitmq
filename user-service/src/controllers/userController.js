const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../middleware/asyncHandler');

exports.createUser = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('Email already exists', 409);
  }
  const user = await User.create({ name, email });
  res.status(201).json({ status: 'success', data: user });
});

exports.getUsers = asyncHandler(async (req, res) => {
  const { email } = req.query;

  if (email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return res.json({ status: 'success', data: user });
  }

  const users = await User.find();
  res.json({ status: 'success', count: users.length, data: users });
});

exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  res.json({ status: 'success', data: user });
});

exports.getUserByEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.params.email });
  if (!user) {
    throw new AppError('User not found', 404);
  }
  res.json({ status: 'success', data: user });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  if (email) {
    const existing = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (existing) {
      throw new AppError('Email already exists', 409);
    }
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, email },
    { new: true, runValidators: true }
  );
  if (!user) {
    throw new AppError('User not found', 404);
  }
  res.json({ status: 'success', data: user });
});

exports.deleteUserById = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  res.json({ status: 'success', message: 'User deleted successfully' });
});

exports.deleteUserByEmail = asyncHandler(async (req, res) => {
  const user = await User.findOneAndDelete({ email: req.params.email });
  if (!user) {
    throw new AppError('User not found', 404);
  }
  res.json({ status: 'success', message: 'User deleted successfully' });
});
