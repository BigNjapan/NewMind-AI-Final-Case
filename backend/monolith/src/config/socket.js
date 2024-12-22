const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const socketMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.join(`user-${decoded.userId}`);
    next();
  } catch (error) {
    console.error('Socket authentication failed:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = {
  init: (server) => {
    io = socketIO(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3500",
        methods: ["GET", "POST"]
      }
    });

    io.use(socketMiddleware);

    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.userId}`);

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.userId}`);
      });

      socket.on('error', (error) => {
        console.error(`Socket error for user ${socket.userId}:`, error);
      });
    });

    return io;
  },
  
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },

  // Utility function to emit events to specific users
  emitToUser: (userId, event, data) => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    io.to(`user-${userId}`).emit(event, data);
  }
}; 