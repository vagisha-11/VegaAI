// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const chatRoutes = require('./routes/chat');
const authRoutes = require('./routes/auth');
const cookieParser = require('cookie-parser');

// Initialize Express app
const app = express();
app.use(cookieParser());

const corsOptions = {
	origin: 'https://vega-ai-mu.vercel.app/', // Your frontend URL
	credentials: true, // Allow cookies to be sent with requests
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
	'/api/chat/save-history',
	express.text({ type: 'text/plain' }),
	(req, res, next) => {
		try {
			req.body = JSON.parse(req.body); // Manually parse the text into JSON
			next(); // Pass to the next middleware (your /save-history route handler)
		} catch (error) {
			res.status(400).json({ error: 'Invalid JSON format' });
		}
	}
);

// Create an HTTP server for Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: 'https://vega-ai-mu.vercel.app/',
	},
});

// Set up Socket.IO connection for real-time streaming
io.on('connection', (socket) => {
	console.log('New client connected');

	// Handle incoming message from client with real-time streaming
	socket.on('send_message', async ({ question, fileContent }) => {
		try {
			const chatSession = model.startChat({
				generationConfig,
				history: [],
			});

			const message = fileContent ? `${fileContent}\n${question}` : question;

			const stream = await chatSession.sendMessageStream(message);
			stream.on('data', (chunk) => {
				// Send partial response to client for progressive loading
				socket.emit('receive_partial_response', { partialAnswer: chunk });
			});

			stream.on('end', () => {
				// Notify client that the response is complete
				socket.emit('receive_response_complete');
			});

			stream.on('error', (error) => {
				console.error('Streaming error:', error);
				socket.emit('receive_response', {
					answer: 'An error occurred during streaming.',
				});
			});
		} catch (error) {
			console.error('Error:', error);
			socket.emit('receive_response', { answer: 'An error occurred.' });
		}
	});

	socket.on('disconnect', () => {
		console.log('Client disconnected');
	});
});

// Use chat routes
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
