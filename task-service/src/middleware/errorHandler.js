const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  req.log.error({ err }, message);

  res.status(statusCode).json({
    status: 'error',
    message,
  });
};

module.exports = errorHandler;
