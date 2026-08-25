import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Room } from './room.js';

const app = express();
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.send({ status: 'ok', time: new Date() });
});

const server = createServer(app);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://kaali-ki-rani.pages.dev',
  'https://kaali-ki-rani-prod.pages.dev'
];
if (process.env.CLIENT_ORIGIN) {
  ALLOWED_ORIGINS.push(process.env.CLIENT_ORIGIN);
}

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      const isAllowed = ALLOWED_ORIGINS.includes(origin) || 
                        origin.endsWith('.pages.dev') || 
                        origin.startsWith('http://localhost:');
                        
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const rooms = new Map(); // roomCode -> Room instance
const socketToRoom = new Map(); // socket.id -> { roomCode, seatIndex }

const FUNNY_WORDS = [
  'BANANA', 'POTATO', 'NOODLE', 'PICKLE', 'WAFFLE', 'BURRITO', 'GIGGLE', 'WIGGLE',
  'DONUT', 'MUFFIN', 'COOKIE', 'PUMPKIN', 'CUPCAKE', 'POPCORN', 'PEANUT', 'COCONUT',
  'CHIPMUNK', 'PENGUIN', 'SQUIRREL', 'MEERKAT', 'SLOTH', 'KOALA', 'BADGER', 'PANDA',
  'DUCKY', 'FROGGY', 'TURTLE', 'OCTOPUS', 'JELLYFISH', 'STARFISH', 'LOBSTER', 'SHRIMP',
  'LLAMA', 'ALPACA', 'DONKEY', 'GOATY', 'PIGLET', 'CHICKEN', 'ROOSTER', 'FLAMINGO',
  'BUBBLES', 'GUMBALL', 'TORNADO', 'DRAGON', 'WIZARD', 'UNICORN', 'MONKEY', 'ROBOT',
  'SPARKLES', 'FEATHER', 'BALLOON', 'KITTEN', 'PUPPY', 'BUNNY', 'HAMSTER', 'HEDGEHOG',
  'PIZZA', 'TACO', 'CHEESE', 'BURGER', 'HONEY', 'CABBAGE', 'BROCCOLI',
  'TOMATO', 'CHERRY', 'BERRY', 'MANGO', 'PEACH', 'MELON', 'APPLE', 'LEMON',
  'SPOON', 'TOASTER', 'TEAPOT', 'SOCKS', 'SNEAKER', 'PAJAMAS', 'BLANKET', 'PILLOW',
  'BUBBLE', 'PADDLE', 'PEBBLE', 'JUNGLE', 'FOREST', 'DESERT', 'OCEAN', 'RIVER',
  'MOUNTAIN', 'VALLEY', 'CANYON', 'CAVERN', 'CASTLE', 'PALACE', 'COTTAGE', 'CABIN',
  'SPIDER', 'BEETLE', 'CRICKET', 'FALCON', 'PARROT', 'SPARROW', 'CANARY', 'SEAGULL'
];

// Helper: Generate unique funny kid-friendly room code
function generateRoomCode() {
  let code = '';
  let attempts = 0;
  do {
    const randomIndex = Math.floor(Math.random() * FUNNY_WORDS.length);
    code = FUNNY_WORDS[randomIndex];
    attempts++;
    // If there is high collision (highly unlikely), append a random digit
    if (attempts > 50) {
      code += Math.floor(Math.random() * 10);
    }
  } while (rooms.has(code));
  return code;
}

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || '';

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    if (!SUPABASE_JWT_SECRET) {
      console.warn("WARNING: SUPABASE_JWT_SECRET environment variable is not defined. Defaulting to local dev-guest.");
      socket.user = { id: 'dev-guest', email: 'dev@example.com', name: 'Dev Guest' };
      return next();
    }
    return next(new Error("Authentication failed: Login is mandatory to play"));
  }

  try {
    if (!SUPABASE_JWT_SECRET) {
      console.warn("WARNING: SUPABASE_JWT_SECRET environment variable is not defined. Skipping token verification.");
      socket.user = { id: 'dev-guest', email: 'dev@example.com', name: 'Dev Guest' };
      return next();
    }
    const secretOrKey = SUPABASE_JWT_SECRET.includes('BEGIN PUBLIC KEY')
      ? SUPABASE_JWT_SECRET.replace(/\\n/g, '\n')
      : SUPABASE_JWT_SECRET;

    const decoded = jwt.verify(token, secretOrKey, {
      algorithms: ['HS256', 'ES256']
    });
    socket.user = {
      id: decoded.sub,
      email: decoded.email,
      name: socket.handshake.auth?.name || decoded.user_metadata?.full_name || decoded.email?.split('@')[0] || 'Player'
    };
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    next(new Error("Authentication failed: Invalid session"));
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Create room
  socket.on('create_room', ({ playerName, settings }, callback) => {
    try {
      const roomCode = generateRoomCode();
      const room = new Room(roomCode, io, settings || {});
      rooms.set(roomCode, room);

      // Create a unique user ID or use authenticated user ID
      const userId = socket.user ? socket.user.id : `user-${Math.random().toString(36).substr(2, 6)}`;
      const activeName = socket.user ? socket.user.name : playerName;
      const seat = room.addPlayer(userId, activeName, socket.id);
      
      socket.join(roomCode);
      socketToRoom.set(socket.id, { roomCode, seatIndex: seat, userId });

      callback({ status: 'success', roomCode, seat, userId });
      room.broadcastState();
      
      console.log(`Room created: ${roomCode} by ${activeName}`);
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

      const activeUserId = socket.user ? socket.user.id : (userId || `user-${Math.random().toString(36).substr(2, 6)}`);
      const activeName = socket.user ? socket.user.name : playerName;
      const seat = room.addPlayer(activeUserId, activeName, socket.id);

      socket.join(code);
      socketToRoom.set(socket.id, { roomCode: code, seatIndex: seat, userId: activeUserId });

      callback({ status: 'success', roomCode: code, seat, userId: activeUserId });
      room.broadcastState();

      console.log(`Player ${activeName} joined Room ${code} in seat ${seat}`);
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
