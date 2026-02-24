import express from 'express';
import http from 'http';

const app = express();
const server = http.createServer(app);

app.get('/ping', (req, res) => {
    res.send('pong');
});

const PORT = 5001;
server.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});
