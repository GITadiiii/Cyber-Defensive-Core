const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const connectDB = require('./config/db');
const incidentRoutes = require('./routes/incidentRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

connectDB();

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Make io accessible inside controllers via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
    console.log('Admin Security Console Connected: ', socket.id);
});

app.get('/api/v1/health', (req, res) => res.json({ status: "Gateway Engine Online" }));

// Threat-broadcast payload shape (emitted from incidentController.js):
// { session_uuid, incidentType, psti_composite, verdict_state, location, timestamp }

app.use('/api/v1', incidentRoutes);app.use('/api/v1/auth', authRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Gateway Core running on port ${PORT}`));