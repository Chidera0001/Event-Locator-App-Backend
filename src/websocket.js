const WebSocket = require('ws');
const logger = require('./config/logger');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    
    this.wss.on('connection', (ws) => {
      logger.info('New WebSocket connection established');
      
      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });
    });
  }

  notifyEventUpdate(eventId, action, data) {
    try {
      if (!this.wss) return;

      const message = JSON.stringify({
        type: 'EVENT_UPDATE',
        eventId,
        action,
        data
      });

      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      logger.error('Error sending WebSocket notification:', error);
    }
  }
}

module.exports = WebSocketServer; 