const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
    console.log('Admin Security Console Connected: ', socket.id);
});

app.get('/api/v1/health', (req, res) => res.json({ status: "Gateway Engine Online" }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Gateway Core running on port ${PORT}`));
