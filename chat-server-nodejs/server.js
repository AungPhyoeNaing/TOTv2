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
        origin: "http://localhost:5173", // Your React app URL
        methods: ["GET", "POST"],
        credentials: true // Important for Sanctum
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
        const response = await axios.get('http://localhost:8000/api/user', { // Adjust Laravel URL
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            timeout: 5000 // Timeout for the request
        });

        socket.userId = response.data.id; // Assuming user ID is in response
        console.log(`Authenticated user ID: ${socket.userId}`);
        next();
    } catch (error) {
        console.error("Sanctum Authentication Error:", error.message);
        next(new Error("Authentication error: Invalid token"));
    }
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} with socket ID: ${socket.id}`);
    connectedUsers[socket.userId] = socket.id;

    // Example: Join a room based on user pair (simplified)
    // In a real app, you'd likely have a more robust room/ID system
    socket.on('joinChat', (data) => {
         // data might contain { otherUserId: ... }
         // Create a consistent room name (e.g., sorted user IDs)
         const userIds = [socket.userId, data.otherUserId].sort();
         const roomName = `chat_${userIds[0]}_${userIds[1]}`;
         socket.join(roomName);
         console.log(`User ${socket.userId} joined room ${roomName}`);
    });


    socket.on('sendMessage', async (messageData) => {
        console.log('Received message ', messageData);

        try {
            // Validate sender
            if (messageData.sender_id != socket.userId) {
               console.error("Sender ID mismatch");
               return socket.emit('messageError', { error: 'Unauthorized sender' });
            }

            // 1. Save message to Laravel database via API
            const response = await axios.post('http://localhost:8000/api/messages', messageData, { // Adjust URL
                headers: {
                    'Authorization': `Bearer ${socket.handshake.auth.token}`,
                },
                timeout: 5000
            });

            const savedMessage = response.data;
            console.log("Message saved to DB:", savedMessage);

            // 2. Broadcast message to the relevant room/users
            // Using the same room naming convention
            const userIds = [savedMessage.sender_id, savedMessage.recipient_id].sort();
            const roomName = `chat_${userIds[0]}_${userIds[1]}`;
            // io.to(roomName).emit('receiveMessage', savedMessage); // Broadcast to room

            // OR, send directly to recipient if online
            const recipientSocketId = connectedUsers[savedMessage.recipient_id];
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('receiveMessage', savedMessage);
                console.log(`Message sent to recipient ${savedMessage.recipient_id}`);
            } else {
                 console.log(`Recipient ${savedMessage.recipient_id} is offline`);
            }

            // Also send confirmation back to sender
            socket.emit('messageSent', savedMessage);

        } catch (error) {
            console.error("Error processing message:", error.response?.data || error.message);
            socket.emit('messageError', { error: 'Failed to send message' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
        delete connectedUsers[socket.userId];
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Chat server running on port ${PORT}`);
});