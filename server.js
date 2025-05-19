const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Serve static files from 'public' directory
app.use(express.static('public'));

// Track connected users
const connectedUsers = new Map();

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle user connection info
    socket.on('user_connected', (userData) => {
        console.log('User connected with data:', userData);

        // Store user data with this socket
        socket.userData = userData;
        connectedUsers.set(socket.id, userData);

        // Send updated user list to all clients
        io.emit('user_list', Array.from(connectedUsers.values()));
    });

    // Handle typing events
    socket.on('typing', () => {
        // Broadcast to others that this user is typing
        if (socket.userData) {
            socket.broadcast.emit('user_typing', socket.userData);
        }
    });

    // Listen for incoming chat messages
    socket.on('chat message', (msg) => {
        // Use the client-provided ID if available, otherwise generate one
        const messageId = msg.id || Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // Add sender information and broadcast
        const messageWithSender = {
          id: messageId,
          sender: socket.userData?.name || 'Anonymous',
          content: msg.content,
          timestamp: msg.timestamp || new Date().toISOString()
        };
        
        // Send to all clients (including sender)
        io.emit('chat_message', messageWithSender);
      });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Remove from connected users
        connectedUsers.delete(socket.id);

        // Send updated user list after disconnect
        io.emit('user_list', Array.from(connectedUsers.values()));
    });
});

// Start server
const PORT = process.env.PORT || 8080;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});