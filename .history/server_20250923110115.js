require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

const liveDataRouter = require('./routes/liveData');
const LiveDataService = require('./services/LiveDataService');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/models', express.static(path.join(__dirname, 'models')));

// Routes
app.use('/api/live-data', liveDataRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// WebSocket connection handling
const liveDataService = new LiveDataService();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'subscribe' && data.category) {
        ws.category = data.category;
        const initialData = await liveDataService.getData(data.category);
        ws.send(JSON.stringify({
          type: 'initial',
          category: data.category,
          data: initialData
        }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Broadcast updates to connected clients
liveDataService.on('dataUpdate', (category, data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.category === category) {
      client.send(JSON.stringify({
        type: 'update',
        category,
        data
      }));
    }
  });
});

// Start data fetching
liveDataService.startFetching();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});

module.exports = { app, server, wss };