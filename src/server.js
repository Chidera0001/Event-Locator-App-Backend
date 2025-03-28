require('dotenv').config();
const http = require('http');
const app = require('./app');
const WebSocketServer = require('./websocket');
const NotificationService = require('./services/notification.service');
const logger = require('./config/logger');

const server = http.createServer(app);
const wss = new WebSocketServer(server);

// Start notification processing
setInterval(() => {
  NotificationService.processNotifications();
}, 60000); // Check every minute

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  logger.info(`WebSocket server running on ws://localhost:${PORT}`);
});

module.exports = { server, wss }; 