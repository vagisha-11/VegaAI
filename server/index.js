const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs').promises;
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');

const geminiApiKey = process.env.GEMINI_API_KEY;

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create an HTTP server for Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: '*',
	},
});

// Multer configuration for file type validation and size limits
const upload = multer({
	dest: 'uploads/',
	limits: { fileSize: 50 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		const fileTypes = /text|csv|json|pdf/;
		const mimeTypes = [
			'text/plain',
			'text/csv',
			'application/json',
			'application/pdf',
		];
		const mimeType = mimeTypes.includes(file.mimetype);
		const extname = fileTypes.test(
			file.originalname.split('.').pop().toLowerCase()
		);

		if (mimeType && extname) {
			return cb(null, true);
		}
		cb(new Error('File type not supported'));
	},
});

// Initialize Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(geminiApiKey);
const fileManager = new GoogleAIFileManager(geminiApiKey);
const model = genAI.getGenerativeModel({
	model: 'gemini-1.5-flash',
});

// Configuration for generation
const generationConfig = {
	temperature: 1,
	topP: 0.95,
	topK: 64,
	maxOutputTokens: 8192,
	responseMimeType: 'text/plain',
};

// Function to generate a response for a single question
const generateResponse = async (question, fileContent) => {
	try {
		const chatSession = model.startChat({
			generationConfig,
			history: [],
		});

		const message = fileContent ? `${fileContent}\n${question}` : question;

		const result = await chatSession.sendMessage(message);
		return result.response.text();
	} catch (error) {
		console.error('Error:', error);
		return 'An error occurred while processing your request.';
	}
};

// POST endpoint to handle chat
app.post('/', upload.single('file'), async (req, res) => {
	const userQuestion = req.body.question;
	const file = req.file;

	let fileContent = '';
	if (file) {
		try {
			fileContent = await fs.readFile(file.path, 'utf-8');
			await fs.unlink(file.path); // Clean up the uploaded file
		} catch (error) {
			console.error('File read error:', error);
			return res.status(500).json({ error: 'File read failed.' });
		}
	}
	try {
		const responseText = await generateResponse(userQuestion, fileContent);
		res.json({ answer: responseText });
	} catch (error) {
		console.error('Error:', error);
		res
			.status(500)
			.json({ error: 'An error occurred while processing your request.' });
	}
});

// Set up Socket.IO connection for voice chat
io.on('connection', (socket) => {
	console.log('New client connected');

	// Handle incoming message from client
	socket.on('send_message', async ({ question, fileContent }) => {
		try {
			const responseText = await generateResponse(question, fileContent);
			// Send response back to client
			socket.emit('receive_response', { answer: responseText });
		} catch (error) {
			console.error('Error:', error);
			socket.emit('receive_response', { answer: 'An error occurred.' });
		}
	});

	socket.on('disconnect', () => {
		console.log('Client disconnected');
	});
});

// Error handling middleware for multer
app.use((err, req, res, next) => {
	if (err instanceof multer.MulterError) {
		res.status(400).json({ error: `Multer error: ${err.message}` });
	} else if (err) {
		res.status(400).json({ error: `Error: ${err.message}` });
	} else {
		next();
	}
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
