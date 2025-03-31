require('dotenv').config();
const http = require('http');
const app = require('./app');
const WebSocketServer = require('./websocket');
const NotificationService = require('./services/notification.service');
const logger = require('./config/logger');
const { testConnection } = require('./config/database');

const server = http.createServer(app);
const wss = new WebSocketServer(server);

// Attach WebSocket server to app.locals
app.locals.wss = wss;

// Start notification processing
setInterval(() => {
  NotificationService.processNotifications();
}, 60000); // Check every minute

const PORT = process.env.PORT || 3000;

// Add error handling for server startup
const startServer = async () => {
  try {
    // Test database connection first
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Could not connect to database');
    }

    await new Promise((resolve, reject) => {
      server.listen(PORT, () => {
        logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
        logger.info(`WebSocket server running on ws://localhost:${PORT}`);
        resolve();
      });

      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${PORT} is already in use`);
          // Try alternative port
          const altPort = PORT + 1;
          logger.info(`Attempting to use alternative port: ${altPort}`);
          server.listen(altPort);
        } else {
          reject(error);
        }
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();

module.exports = { server, wss }; 