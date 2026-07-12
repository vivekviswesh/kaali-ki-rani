import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Room } from './room.js';

const app = express();
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.send({ status: 'ok', time: new Date() });
});

const server = createServer(app);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const rooms = new Map(); // roomCode -> Room instance
const socketToRoom = new Map(); // socket.id -> { roomCode, seatIndex }

// Helper: Generate unique 4-character room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms.has(code));
  return code;
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Create room
  socket.on('create_room', ({ playerName, settings }, callback) => {
    try {
      const roomCode = generateRoomCode();
      const room = new Room(roomCode, io, settings || {});
      rooms.set(roomCode, room);

      // Create a unique user ID or use socket ID
      const userId = `user-${Math.random().toString(36).substr(2, 6)}`;
      const seat = room.addPlayer(userId, playerName, socket.id);
      
      socket.join(roomCode);
      socketToRoom.set(socket.id, { roomCode, seatIndex: seat, userId });

      callback({ status: 'success', roomCode, seat, userId });
      room.broadcastState();
      
      console.log(`Room created: ${roomCode} by ${playerName}`);
    } catch (err) {
      console.error(err);
      callback({ status: 'error', message: err.message });
    }
  });

  // Join room
  socket.on('join_room', ({ roomCode, playerName, userId }, callback) => {
    try {
      const code = roomCode.toUpperCase().trim();
      const room = rooms.get(code);

      if (!room) {
        return callback({ status: 'error', message: 'Room not found.' });
      }

      const activeUserId = userId || `user-${Math.random().toString(36).substr(2, 6)}`;
      const seat = room.addPlayer(activeUserId, playerName, socket.id);

      socket.join(code);
      socketToRoom.set(socket.id, { roomCode: code, seatIndex: seat, userId: activeUserId });

      callback({ status: 'success', roomCode: code, seat, userId: activeUserId });
      room.broadcastState();

      console.log(`Player ${playerName} joined Room ${code} in seat ${seat}`);
    } catch (err) {
      console.error(err);
      callback({ status: 'error', message: err.message });
    }
  });

  // Start game
  socket.on('start_game', () => {
    const session = socketToRoom.get(socket.id);
    if (!session) return;

    const room = rooms.get(session.roomCode);
    if (room) {
      room.start();
      console.log(`Game started in Room ${session.roomCode}`);
    }
  });

  // Game actions (bids, declarations, playing card, next hand)
  socket.on('game_action', ({ type, data }) => {
    const session = socketToRoom.get(socket.id);
    if (!session) return;

    const room = rooms.get(session.roomCode);
    if (room) {
      try {
        room.handlePlayerAction(socket.id, type, data);
      } catch (err) {
        console.error(`Action error in room ${session.roomCode}:`, err.message);
        socket.emit('action_error', { message: err.message });
      }
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const session = socketToRoom.get(socket.id);
    if (session) {
      const room = rooms.get(session.roomCode);
      if (room) {
        const removedPlayer = room.removePlayer(socket.id);
        socketToRoom.delete(socket.id);

        // If room is empty of human players, clean it up
        const activeHumans = room.seats.filter(s => s && !s.isBot && !s.isDisconnected);
        if (activeHumans.length === 0) {
          console.log(`Room ${session.roomCode} is empty. Cleaning up.`);
          room.destroy();
          rooms.delete(session.roomCode);
        }
      }
    }
  });
});

// Clean up inactive rooms sweep every 10 minutes
setInterval(() => {
  const now = Date.now();
  console.log(`Running room cleanup sweep. Active rooms: ${rooms.size}`);
  for (const [code, room] of rooms.entries()) {
    // If the room has no connected sockets for a while
    const activeHumans = room.seats.filter(s => s && !s.isBot && !s.isDisconnected);
    if (activeHumans.length === 0) {
      console.log(`Sweeping inactive Room ${code}`);
      room.destroy();
      rooms.delete(code);
    }
  }
}, 10 * 60 * 1000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Kaali Ki Rani server running on port ${PORT}`);
});
