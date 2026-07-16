const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const incidentRoutes = require('./routes/incidentRoutes');

const app = express();
app.use(cors());
app.use(express.json());

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
app.use('/api/v1', incidentRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Gateway Core running on port ${PORT}`));