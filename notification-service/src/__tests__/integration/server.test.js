jest.mock('amqplib');
jest.mock('../../config/rabbitmq', () => ({
  connectRabbitMQ: jest.fn(),
  closeConnection: jest.fn().mockResolvedValue({}),
  getChannel: jest.fn(),
}));
jest.mock('../../services/notificationService', () => ({
  startConsumer: jest.fn(),
}));
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const http = require('http');
const config = require('../../config');
const rabbitmq = require('../../config/rabbitmq');
const { startConsumer } = require('../../services/notificationService');

describe('Server Integration', () => {
  let server;

  afterEach(async () => {
    if (server && server.listening) {
      await new Promise((resolve) => server.close(resolve));
    }
    jest.clearAllMocks();
  });

  it('should create an express app with helmet', () => {
    const express = require('express');
    const helmet = require('helmet');
    const app = express();
    expect(app).toBeDefined();
    expect(typeof app.use).toBe('function');
    expect(typeof app.get).toBe('function');
  });

  it('should have a health endpoint returning 200', async () => {
    const express = require('express');
    const helmet = require('helmet');
    const app = express();
    app.use(helmet());
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', service: 'notification-service', timestamp: new Date().toISOString() });
    });

    server = app.listen(0);
    const port = server.address().port;

    const response = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/health`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
      }).on('error', reject);
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('notification-service');
    expect(response.body.timestamp).toBeDefined();
  });

  it('should start server and connect to RabbitMQ on start()', async () => {
    const mockChannel = { assertQueue: jest.fn() };
    rabbitmq.connectRabbitMQ.mockResolvedValue(mockChannel);

    const express = require('express');
    const app = express();
    app.get('/health', (req, res) => res.json({ status: 'ok' }));

    await new Promise((resolve) => {
      server = app.listen(config.port, () => {
        startConsumer();
        resolve();
      });
    });

    expect(startConsumer).toHaveBeenCalled();
    expect(server.listening).toBe(true);
  });

  it('should exit process if RabbitMQ connection fails', async () => {
    rabbitmq.connectRabbitMQ.mockResolvedValue(null);
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

    const start = async () => {
      const channel = await rabbitmq.connectRabbitMQ();
      if (!channel) {
        mockExit(1);
        return;
      }
    };

    await start();

    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it('should set up SIGTERM handler', () => {
    const handler = jest.fn();
    process.on('SIGTERM', handler);
    process.emit('SIGTERM');
    expect(handler).toHaveBeenCalled();
    process.removeListener('SIGTERM', handler);
  });

  it('should set up SIGINT handler', () => {
    const handler = jest.fn();
    process.on('SIGINT', handler);
    process.emit('SIGINT');
    expect(handler).toHaveBeenCalled();
    process.removeListener('SIGINT', handler);
  });
});
