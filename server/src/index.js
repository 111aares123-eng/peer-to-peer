const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { PORT } = require('./config');

const authRoutes = require('./routes/authRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const escrowRoutes = require('./routes/escrowRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const chatRoutes = require('./routes/chatRoutes');
const moderationRoutes = require('./routes/moderationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Real-time WebSocket layer
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

// Socket.io real-time connection & collaborative whiteboard handlers
io.on('connection', (socket) => {
  // Join a booking room for masked chat, video signaling & collaborative whiteboard
  socket.on('join_booking_room', ({ bookingId, user }) => {
    socket.join(`booking_${bookingId}`);
  });

  // Collaborative whiteboard sync
  socket.on('whiteboard_draw', ({ bookingId, drawData }) => {
    socket.to(`booking_${bookingId}`).emit('whiteboard_draw', drawData);
  });

  socket.on('whiteboard_clear', ({ bookingId }) => {
    socket.to(`booking_${bookingId}`).emit('whiteboard_clear');
  });

  // Video call signaling (mock / WebRTC)
  socket.on('video_signal', ({ bookingId, signal, senderId }) => {
    socket.to(`booking_${bookingId}`).emit('video_signal', { signal, senderId });
  });

  socket.on('disconnect', () => {});
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Peer-to-Peer Academic Help Marketplace API',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[API Error]:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[Peer-to-Peer Marketplace API] running on http://localhost:${PORT}`);
  });
}

module.exports = { app, server };
