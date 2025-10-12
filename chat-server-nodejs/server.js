/*********************************************************************
 *  Real-time Server  –  DRY / optimised / online-status
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

/* ---------- Middleware ---------- */
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

/* ---------- Socket.IO ---------- */
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'], credentials: true }
});

/* ---------- In-Memory Online Store ---------- */
const connectedUsers = {}; // { userId: socketId }

/* ---------- DRY AXIOS INSTANCE ---------- */
const laravel = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 5000
});
laravel.interceptors.request.use((cfg) => {
  const token = cfg.headers.common?.Authorization?.replace('Bearer ', '') || cfg.headers.Authorization;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

/* ---------- Socket Authentication ---------- */
io.use(async (socket, next) => {
  try {
    const res = await laravel.get('/user', { headers: { Authorization: socket.handshake.auth.token } });
    socket.userId = res.data.id;
    next();
  } catch (e) {
    next(new Error('Authentication error'));
  }
});

/* ---------- Connection Handler ---------- */
io.on('connection', (socket) => {
  const uid = socket.userId;
  console.log(`[Connect] ${uid}  (${socket.id})`);
  connectedUsers[uid] = socket.id;

  /* 1️⃣  online broadcast */
  socket.broadcast.emit('userOnline', { userId: uid });

  /* 2️⃣  send current online list once */
  socket.emit('onlineList', Object.keys(connectedUsers).map(Number));

  /* ---------- Existing Events ---------- */
  socket.on('joinChat', ({ otherUserId }) => {
    const room = `chat_${[uid, otherUserId].sort().join('_')}`;
    socket.join(room);
    console.log(`[Chat] ${uid} joined ${room}`);
  });

  socket.on('postReactionUpdated', async ({ postId }) => {
    if (!postId) return;
    try {
      const [myReact, postsRes] = await Promise.all([
        laravel.get(`/posts/${postId}/my-reaction`, { headers: { Authorization: socket.handshake.auth.token } }),
        laravel.get('/posts', { headers: { Authorization: socket.handshake.auth.token } })
      ]);
      const post = postsRes.data.find(p => p.id == postId);
      if (!post) return;

      io.emit('reactionUpdated', {
        post_id: postId,
        likes_count: post.likes_count ?? 0,
        sads_count: post.sads_count ?? 0,
        angries_count: post.angries_count ?? 0,
        reactions_count: (post.likes_count ?? 0) + (post.sads_count ?? 0) + (post.angries_count ?? 0),
        user_reaction: myReact.data.type || null
      });
    } catch (e) {
      console.error('[Reaction]', e.message);
    }
  });

  socket.on('postCommentAdded', ({ postId, comment }) => {
    if (!postId || !comment) return;
    io.emit('commentAdded', { ...comment, post_id: postId });
  });

  socket.on('sendMessage', async (msg) => {
    if (msg.sender_id != uid) return socket.emit('messageError', { error: 'Unauthorized' });
    try {
      const { data } = await laravel.get(`/users/${uid}/is-mutual-follow/${msg.recipient_id}`, { headers: { Authorization: socket.handshake.auth.token } });
      if (!data.is_mutual_follow) return socket.emit('messageError', { error: 'Not mutual followers' });

      const saved = await laravel.post('/messages', msg, { headers: { Authorization: socket.handshake.auth.token } });
      const recipientSocket = connectedUsers[msg.recipient_id];
      if (recipientSocket) io.to(recipientSocket).emit('receiveMessage', saved.data);
      socket.emit('messageSent', saved.data);
    } catch (e) {
      console.error('[Message]', e.message);
      socket.emit('messageError', { error: 'Failed to send message' });
    }
  });

  /* ---------- Disconnect ---------- */
  socket.on('disconnect', () => {
    console.log(`[Disconnect] ${uid}`);
    delete connectedUsers[uid];
    socket.broadcast.emit('userOffline', { userId: uid });
  });
});

/* ---------- Laravel → Node ping route ---------- */
app.post('/api/notify-login', (req, res) => {
  if (req.headers['x-api-key'] !== process.env.NODE_SERVER_KEY) return res.status(403).json({ error: 'Forbidden' });
  if (!req.body.user?.id) return res.status(400).json({ error: 'Invalid user' });
  io.emit('userJoined', req.body.user);
  res.json({ success: true });
});

/* ---------- Start Server ---------- */
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));