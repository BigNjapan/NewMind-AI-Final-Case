const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeWebSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.userId);

    // Join a room specific to this user
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.userId);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Helper function to send notifications to specific users
const sendNotification = (userId, type, data) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit('notification', {
      type,
      data,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

module.exports = {
  initializeWebSocket,
  getIO,
  sendNotification
}; 