require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3001,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/user-service',
  nodeEnv: process.env.NODE_ENV || 'development',
};
