require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors'); // CORS package

// Create the Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});
const PORT = 3000;

// --- Middlewares ---
app.use(cors()); // Use CORS to allow requests from frontend
app.use(express.json()); // Use Express's JSON parser

// Create a new connection pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// --- A middleware function to protect routes ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- User Signup Route ---
app.post('/auth/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newUser = await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
            [username, passwordHash]
        );
        res.status(201).json({
            message: 'User created successfully',
            user: newUser.rows[0],
        });
    } catch (err) {
        console.error('Error during signup:', err.stack);
        res.status(500).json({ error: 'Server error during signup' });
    }
});

// --- User Login Route ---
app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }
        const user = userResult.rows[0];
        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordCorrect) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }
        const tokenPayload = { id: user.id, username: user.username };
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Logged in successfully', token: token });
    } catch (err) {
        console.error('Error during login:', err.stack);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// --- A protected route ---
app.get('/api/profile', authenticateToken, (req, res) => {
    res.json({
        message: `Welcome, ${req.user.username}! This is protected data.`,
        user: req.user
    });
});

// --- Start a New Conversation Route ---
app.post('/api/conversations', authenticateToken, async (req, res) => {
    const { recipientId } = req.body;
    const senderId = req.user.id;
    if (!recipientId) {
        return res.status(400).json({ error: 'Recipient ID is required' });
    }
    const senderIdNum = parseInt(senderId, 10);
    const recipientIdNum = parseInt(recipientId, 10);
    if (senderIdNum === recipientIdNum) {
        return res.status(400).json({ error: 'Cannot start a conversation with yourself' });
    }
    try {
        const existingConvo = await pool.query(
            `SELECT conversation_id FROM participants WHERE conversation_id IN (SELECT conversation_id FROM participants WHERE user_id = $1) AND user_id = $2`,
            [senderIdNum, recipientIdNum]
        );
        if (existingConvo.rows.length > 0) {
            return res.status(200).json({
                message: 'Conversation already exists',
                conversationId: existingConvo.rows[0].conversation_id,
            });
        }
        const newConversation = await pool.query('INSERT INTO conversations DEFAULT VALUES RETURNING id');
        const conversationId = newConversation.rows[0].id;
        await pool.query(
            'INSERT INTO participants (user_id, conversation_id) VALUES ($1, $2), ($3, $4)',
            [senderIdNum, conversationId, recipientIdNum, conversationId]
        );
        res.status(201).json({
            message: 'Conversation created successfully',
            conversationId: conversationId,
        });
    } catch (err) {
        console.error('Error creating conversation:', err.stack);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Send a Message Route ---
app.post('/api/messages', authenticateToken, async (req, res) => {
    const { conversationId, messageText } = req.body;
    const senderId = req.user.id;
    if (!conversationId || !messageText) {
        return res.status(400).json({ error: 'Conversation ID and message text are required' });
    }
    try {
        const participantCheck = await pool.query(
            'SELECT * FROM participants WHERE user_id = $1 AND conversation_id = $2',
            [senderId, conversationId]
        );
        if (participantCheck.rows.length === 0) {
            return res.status(403).json({ error: 'You are not a member of this conversation' });
        }
        const newMessageResult = await pool.query(
            `INSERT INTO messages (conversation_id, sender_id, message_text) 
             VALUES ($1, $2, $3) 
             RETURNING id, conversation_id, sender_id, message_text, sent_at`,
            [conversationId, senderId, messageText]
        );
        const finalMessage = {
            ...newMessageResult.rows[0],
            sender_username: req.user.username
        };
        io.to(conversationId.toString()).emit('receive_message', finalMessage);
        res.status(201).json({
            message: 'Message sent successfully',
            sentMessage: finalMessage
        });
    } catch (err) {
        console.error('Error sending message:', err.stack);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Get All Messages From a Conversation Route ---
app.get('/api/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;
    try {
        const participantCheck = await pool.query(
            'SELECT * FROM participants WHERE user_id = $1 AND conversation_id = $2',
            [userId, conversationId]
        );
        if (participantCheck.rows.length === 0) {
            return res.status(403).json({ error: 'You are not authorized to view this conversation' });
        }
        const messagesResult = await pool.query(
            `SELECT m.id, m.message_text, m.sent_at, u.username AS sender_username
             FROM messages AS m
             JOIN users AS u ON m.sender_id = u.id
             WHERE m.conversation_id = $1
             ORDER BY m.sent_at ASC`,
            [conversationId]
        );
        res.status(200).json(messagesResult.rows);
    } catch (err) {
        console.error('Error fetching messages:', err.stack);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Real-Time Logic: Listen for new connections ---
io.on('connection', (socket) => {
    console.log('✅ A user connected via WebSocket:', socket.id);

    socket.on('join_conversation', (conversationId) => {
        console.log(`User ${socket.id} joined conversation room: ${conversationId}`);
        socket.join(conversationId.toString());
    });

    socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);
    });
});

// --- Start the server ---
server.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});