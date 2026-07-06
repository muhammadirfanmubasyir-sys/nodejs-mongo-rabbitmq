const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const taskRoutes = require('./routes/taskRoutes');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const AppError = require('./utils/AppError');
const { getChannel } = require('./config/rabbitmq');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

app.use(requestLogger);

app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbReady = mongoose.connection.readyState === 1;
  const rabbitReady = getChannel() !== null;
  const status = dbReady && rabbitReady ? 'healthy' : 'degraded';
  res.status(dbReady ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    checks: { mongodb: dbReady ? 'up' : 'down', rabbitmq: rabbitReady ? 'up' : 'down' },
  });
});

app.use('/api/tasks', taskRoutes);

app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

app.use(errorHandler);

module.exports = app;
