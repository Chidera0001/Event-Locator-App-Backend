const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // Map to store client connections

    this.wss.on('connection', (ws, req) => this.handleConnection(ws, req));
  }

  handleConnection(ws, req) {
    const token = req.url.split('token=')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      this.clients.set(decoded.id, ws);

      ws.on('message', (message) => this.handleMessage(decoded.id, message));
      ws.on('close', () => this.clients.delete(decoded.id));
    } catch (error) {
      ws.close();
    }
  }

  handleMessage(userId, message) {
    try {
      const data = JSON.parse(message);
      logger.info(`Received message from user ${userId}:`, data);
    } catch (error) {
      logger.error('Error handling WebSocket message:', error);
    }
  }

  notifyEventUpdate(eventId, updateType, data) {
    const message = JSON.stringify({
      type: 'event_update',
      eventId,
      updateType,
      data
    });

    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

module.exports = WebSocketServer; 