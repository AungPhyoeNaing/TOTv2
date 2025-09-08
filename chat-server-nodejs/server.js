const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = new socketIo.Server(server, {
    cors: {
        origin: "http://localhost:5173", // Adjust if your frontend runs elsewhere
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Store connected users (use Redis in production)
const connectedUsers = {}; // { userId: socketId }

// Middleware to authenticate socket connection using Sanctum
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error("Authentication error: No token provided"));
    }

    try {
        // Verify token by calling Laravel's user endpoint
        const response = await axios.get('http://localhost:8000/api/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            timeout: 5000
        });

        socket.userId = response.data.id; // Assuming user ID is in response
        console.log(`[Auth] Authenticated user ID: ${socket.userId}`);
        next();
    } catch (error) {
        console.error("[Auth] Sanctum Authentication Error:", error.message);
        next(new Error("Authentication error: Invalid token"));
    }
});

io.on('connection', (socket) => {
    console.log(`[Connection] User connected: ${socket.userId} with socket ID: ${socket.id}`);
    connectedUsers[socket.userId] = socket.id;

    socket.on('joinChat', (data) => {
        const userIds = [socket.userId, data.otherUserId].sort();
        const roomName = `chat_${userIds[0]}_${userIds[1]}`;
        socket.join(roomName);
        console.log(`[Chat] User ${socket.userId} joined room ${roomName}`);
    });

    
    socket.on('postReactionUpdated', async (data) => {
        console.log(`[Reaction] Update notification for post ${data.postId} from user ${socket.userId}:`, data);

        if (!data.postId) {
            console.error("[Reaction] Missing postId in postReactionUpdated data:", data);
            return;
        }

        try {
            // --- Fetch latest data from Laravel ---
            // 1. Get the current user's reaction for this post
            const userReactionRes = await axios.get(`http://localhost:8000/api/posts/${data.postId}/my-reaction`, {
                headers: { 'Authorization': `Bearer ${socket.handshake.auth.token}` },
                timeout: 5000
            });

            const currentUserReaction = userReactionRes.data.type || null;

            // 2. Get the post details to get the latest counts
            // Note: Fetching all posts might be inefficient for large lists.
            const postsRes = await axios.get(`http://localhost:8000/api/posts`, {
                 headers: { 'Authorization': `Bearer ${socket.handshake.auth.token}` },
                 timeout: 5000
            });

            // Find the specific post in the list
            const post = postsRes.data.find(p => p.id == data.postId);

            if (!post) {
                console.error(`[Reaction] Post with ID ${data.postId} not found in /api/posts response.`);
                return;
            }

            // Ensure counts are available on the post object
            const likesCount = post.likes_count ?? 0;
            const sadsCount = post.sads_count ?? 0;
            const angriesCount = post.angries_count ?? 0;
            const totalReactions = post.reactions_count ?? (likesCount + sadsCount + angriesCount);

            // --- Prepare payload for clients ---
            const reactionUpdatePayload = {
                post_id: data.postId,
                likes_count: likesCount,
                sads_count: sadsCount,
                angries_count: angriesCount,
                reactions_count: totalReactions,
                user_reaction: currentUserReaction
            };

            // --- Emit the event to all connected clients ---
            io.emit('reactionUpdated', reactionUpdatePayload);
            console.log("[Reaction] Emitted 'reactionUpdated' to all clients:", reactionUpdatePayload);

        } catch (error) {
            console.error(`[Reaction] Error fetching updated data for post ${data.postId}:`, error.response?.data || error.message);
        }
    });
  
    socket.on('postCommentAdded', async (data) => {
        console.log(`[Comment] Added notification for post ${data.postId} from user ${socket.userId}:`, data);

        if (!data.postId || !data.comment) {
             console.error("[Comment] Invalid comment data received in postCommentAdded:", data);
             return;
        }

        try {
            // --- Prepare the comment data for clients ---
            // The client is expected to send the full comment object returned by the Laravel API
            const newComment = data.comment;

            // Ensure it has the post_id for the frontend listener
            if (!newComment.post_id) {
                newComment.post_id = data.postId; // Attach post_id if missing
            }

            // --- ADDITIONAL LOGGING FOR DEBUGGING ---
            console.log(`[Comment] [Server] About to emit 'commentAdded' to all clients for comment:`, newComment);
            // --- Emit the event to all connected clients ---
            io.emit('commentAdded', newComment);
            console.log(`[Comment] [Server] Emitted 'commentAdded' to all clients.`);

        } catch (error) {
             console.error(`[Comment] Error processing new comment notification for post ${data.postId}:`, error.response?.data || error.message);
        }
    });
    // --- End Event Listener ---


    socket.on('sendMessage', async (messageData) => {
    console.log('[Message] Received message ', messageData);

    try {
        // Validate sender
        if (messageData.sender_id != socket.userId) {
           console.error("[Message] Sender ID mismatch");
           return socket.emit('messageError', { error: 'Unauthorized sender' });
        }

        // --- NEW: Check Mutual Follow Status BEFORE saving ---
        const senderId = messageData.sender_id;
        const recipientId = messageData.recipient_id;

        // Call Laravel API to check mutual follow
        // You need to create this endpoint in Laravel
        const followCheckResponse = await axios.get(
            `http://localhost:8000/api/users/${senderId}/is-mutual-follow/${recipientId}`,
            {
                headers: {
                    'Authorization': `Bearer ${socket.handshake.auth.token}`,
                },
                timeout: 5000
            }
        );

        // Assuming the Laravel endpoint returns { is_mutual_follow: true/false }
        const isMutualFollow = followCheckResponse.data.is_mutual_follow;

        if (!isMutualFollow) {
            console.log(`[Message] Message blocked. Users ${senderId} and ${recipientId} are not mutual followers.`);
            // Emit error back to the sender
            return socket.emit('messageError', { error: 'You can only message users you mutually follow.' });
         
        }
        // --- END NEW CHECK ---

        // 1. Save message to Laravel database via API (only if mutual follow check passes)
        const response = await axios.post('http://localhost:8000/api/messages', messageData, {
            headers: {
                'Authorization': `Bearer ${socket.handshake.auth.token}`,
            },
            timeout: 5000
        });

        const savedMessage = response.data;
        console.log("[Message] Message saved to DB:", savedMessage);

        // 2. Broadcast message to the relevant room/users
        const userIds = [savedMessage.sender_id, savedMessage.recipient_id].sort();
        const roomName = `chat_${userIds[0]}_${userIds[1]}`;

        const recipientSocketId = connectedUsers[savedMessage.recipient_id];
        if (recipientSocketId) {
            // Emit directly to recipient's socket
            io.to(recipientSocketId).emit('receiveMessage', savedMessage);
            console.log(`[Message] Message sent to recipient ${savedMessage.recipient_id}`);
        } else {
             console.log(`[Message] Recipient ${savedMessage.recipient_id} is offline`);
        }

        // Also send confirmation back to sender
        socket.emit('messageSent', savedMessage);

    } catch (error) {
       
        if (error.response && error.response.status === 403) {
             // Assume 403 is from our mutual follow check endpoint
             console.log("[Message] Mutual follow check failed:", error.response?.data?.error || error.message);
           
             socket.emit('messageError', { error: error.response?.data?.error || 'Messaging restricted by follow rules.' });
        } else {
            console.error("[Message] Error processing message:", error.response?.data || error.message);
            socket.emit('messageError', { error: 'Failed to send message' });
        }
    }
});

    socket.on('disconnect', () => {
        console.log(`[Disconnection] User disconnected: ${socket.userId}`);
        delete connectedUsers[socket.userId];
    });
});
app.use(express.json()); // Make sure you have this middleware

app.post('/api/notify-login', (req, res) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.NODE_SERVER_KEY) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { user } = req.body;

    if (!user || !user.id) {
        return res.status(400).json({ error: 'Invalid user data' });
    }

    // ✅ BROADCAST TO ALL CONNECTED CLIENTS
    io.emit('userJoined', user);
    console.log(`[User Presence] Broadcasted userJoined for:`, user.name);

    res.json({ success: true });
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`[Server] Server (Chat + Real-time Updates) running on port ${PORT}`);
});