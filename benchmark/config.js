module.exports = {
  // Benchmark duration in seconds per endpoint
  duration: 5,

  // Number of concurrent connections
  connections: 100,

  // HTTP pipelining factor (requests sent without waiting for response)
  pipelining: 10,

  // Timeout for each benchmark in ms
  timeout: 30000,

  // Services to benchmark
  services: [
    {
      name: 'user-service',
      port: 3001,
      endpoints: [
        { label: 'GET  /health',           method: 'GET',  path: '/health' },
        { label: 'POST /api/users',        method: 'POST', path: '/api/users',        body: { name: 'Bench', email: 'bench@test.com' } },
        { label: 'GET  /api/users',        method: 'GET',  path: '/api/users' },
        { label: 'GET  /api/users/id/:id', method: 'GET',  path: '/api/users/id/1' },
        { label: 'PUT  /api/users/:id',    method: 'PUT',  path: '/api/users/1',      body: { name: 'Updated' } },
        { label: 'DEL  /api/users/id/:id', method: 'DELETE', path: '/api/users/id/1' },
      ],
    },
    {
      name: 'task-service',
      port: 3002,
      endpoints: [
        { label: 'GET  /health',           method: 'GET',  path: '/health' },
        { label: 'POST /api/tasks',        method: 'POST', path: '/api/tasks',        body: { title: 'Bench', description: 'test', userId: 'u1' } },
        { label: 'GET  /api/tasks',        method: 'GET',  path: '/api/tasks' },
        { label: 'GET  /api/tasks/:id',    method: 'GET',  path: '/api/tasks/1' },
      ],
    },
    {
      name: 'notification-service',
      port: 3003,
      endpoints: [
        { label: 'GET /health', method: 'GET', path: '/health' },
      ],
    },
  ],
};
