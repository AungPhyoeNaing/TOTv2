/*********************************************************************
 *  Real-time Server – DRY / Optimised / Online Status
 *  Drop-in replacement – no new bugs
 *********************************************************************/
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');

const app = express();
const server = http.createServer(app);

/* ---------- Constants ---------- */
const EVENTS = {
  USER_ONLINE: 'userOnline',
  USER_OFFLINE: 'userOffline',
  USER_JOINED: 'userJoined',
  ONLINE_LIST: 'onlineList',
  REACTION_UPDATED: 'reactionUpdated',
  COMMENT_ADDED: 'commentAdded',
  SEND_MESSAGE: 'sendMessage',
  RECEIVE_MESSAGE: 'receiveMessage',
  MESSAGE_SENT: 'messageSent',
  MESSAGE_ERROR: 'messageError',
};

/* ---------- Middleware ---------- */
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

/* ---------- Socket.IO ---------- */
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'], credentials: true },
  // Optional: add ping/pong timeout for faster disconnect detection
  pingTimeout: 5000,
  pingInterval: 10000,
});

/* ---------- In-Memory Online Store (Supports Multiple Connections per User) ---------- */
// { userId: Set<socketId> }
const connectedUsers = new Map();

/* ---------- DRY AXIOS INSTANCE ---------- */
const laravel = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 5000,
});
laravel.interceptors.request.use((cfg) => {
  const token = cfg.headers.common?.Authorization?.replace('Bearer ', '') || cfg.headers.Authorization;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

/* ---------- Socket Authentication ---------- */
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Missing authentication token'));
  }

  try {
    const res = await laravel.get('/user', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.data?.id) {
      return next(new Error('Invalid user data from auth endpoint'));
    }
    socket.userId = res.data.id;
    socket.authToken = token; // Store for reuse
    next();
  } catch (e) {
    console.error(`[Auth] Failed for token (user unknown): ${e.message}`);
    next(new Error('Invalid or expired token'));
  }
});

/* ---------- Connection Handler ---------- */
io.on('connection', (socket) => {
  const uid = socket.userId;
  console.log(`[Connect] User ${uid} via socket ${socket.id}`);

  // Add socket to user's connection set
  if (!connectedUsers.has(uid)) {
    connectedUsers.set(uid, new Set());
  }
  connectedUsers.get(uid).add(socket.id);

  // 1️⃣ Broadcast that this user is online (only if first connection)
  if (connectedUsers.get(uid).size === 1) {
    socket.broadcast.emit(EVENTS.USER_ONLINE, { userId: uid });
  }

  // 2️⃣ Send current online list (user IDs only)
  const onlineUserIds = Array.from(connectedUsers.keys()).map(Number);
  socket.emit(EVENTS.ONLINE_LIST, onlineUserIds);

  /* ---------- Chat Room Join ---------- */
  socket.on('joinChat', ({ otherUserId }) => {
    if (typeof otherUserId !== 'number' || otherUserId <= 0) return;
    const room = `chat_${[uid, otherUserId].sort((a, b) => a - b).join('_')}`;
    socket.join(room);
    console.log(`[Chat] ${uid} joined room ${room}`);
  });

  /* ---------- Reaction Update ---------- */
  socket.on('postReactionUpdated', async ({ postId }) => {
    if (typeof postId !== 'number' || postId <= 0) return;

    try {
      // Fetch only the specific post (not all posts!)
      const [myReactRes, postRes] = await Promise.all([
        laravel.get(`/posts/${postId}/my-reaction`, { headers: { Authorization: `Bearer ${socket.authToken}` } }),
        laravel.get(`/posts/${postId}`, { headers: { Authorization: `Bearer ${socket.authToken}` } })
      ]);

      const post = postRes.data;
      if (!post || post.id !== postId) return;

      const likes = post.likes_count ?? 0;
      const sads = post.sads_count ?? 0;
      const angries = post.angries_count ?? 0;

      io.emit(EVENTS.REACTION_UPDATED, {
        post_id: postId,
        likes_count: likes,
        sads_count: sads,
        angries_count: angries,
        reactions_count: likes + sads + angries,
        user_reaction: myReactRes.data?.type || null
      });
    } catch (e) {
      console.error(`[Reaction] Failed for post ${postId}, user ${uid}:`, e.message);
    }
  });

  /* ---------- Comment Added ---------- */
  socket.on('postCommentAdded', ({ postId, comment }) => {
    if (typeof postId !== 'number' || postId <= 0 || !comment || typeof comment !== 'object') return;
    if (!comment.content || typeof comment.content !== 'string') return;

    io.emit(EVENTS.COMMENT_ADDED, { ...comment, post_id: postId });
  });

  /* ---------- Send Message ---------- */
  socket.on(EVENTS.SEND_MESSAGE, async (msg) => {
    if (!msg || msg.sender_id !== uid) {
      return socket.emit(EVENTS.MESSAGE_ERROR, { error: 'Unauthorized' });
    }

    const { recipient_id: recipientId } = msg;
    if (typeof recipientId !== 'number' || recipientId <= 0) {
      return socket.emit(EVENTS.MESSAGE_ERROR, { error: 'Invalid recipient' });
    }

    try {
      // Check mutual follow
      const followRes = await laravel.get(`/users/${uid}/is-mutual-follow/${recipientId}`, {
        headers: { Authorization: `Bearer ${socket.authToken}` }
      });

      if (!followRes.data?.is_mutual_follow) {
        return socket.emit(EVENTS.MESSAGE_ERROR, { error: 'Not mutual followers' });
      }

      // Save message
      const savedRes = await laravel.post('/messages', msg, {
        headers: { Authorization: `Bearer ${socket.authToken}` }
      });

      // Deliver to all active recipient sockets
      const recipientSockets = connectedUsers.get(recipientId);
      if (recipientSockets && recipientSockets.size > 0) {
        recipientSockets.forEach(sid => {
          io.to(sid).emit(EVENTS.RECEIVE_MESSAGE, savedRes.data);
        });
      }

      socket.emit(EVENTS.MESSAGE_SENT, savedRes.data);
    } catch (e) {
      console.error(`[Message] Failed from ${uid} to ${recipientId}:`, e.message);
      socket.emit(EVENTS.MESSAGE_ERROR, { error: 'Failed to send message' });
    }
  });

  /* ---------- Disconnect Handler ---------- */
  socket.on('disconnect', () => {
    console.log(`[Disconnect] User ${uid} (socket ${socket.id})`);

    const userSockets = connectedUsers.get(uid);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        connectedUsers.delete(uid);
        socket.broadcast.emit(EVENTS.USER_OFFLINE, { userId: uid });
      }
    }
  });
});

/* ---------- Laravel → Node Ping Route ---------- */
app.post('/api/notify-login', (req, res) => {
  if (req.headers['x-api-key'] !== process.env.NODE_SERVER_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!req.body?.user?.id || typeof req.body.user.id !== 'number') {
    return res.status(400).json({ error: 'Invalid user' });
  }

  io.emit(EVENTS.USER_JOINED, req.body.user);
  res.json({ success: true });
});

/* ---------- Graceful Shutdown ---------- */
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Closed.');
    process.exit(0);
  });
});

/* ---------- Start Server ---------- */
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));