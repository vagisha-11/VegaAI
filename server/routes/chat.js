const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const authLogin = require('../middleware/authToken');
const pdfParse = require('pdf-parse');
const ChatHistory = require('../models/chatlog.js');

const router = express.Router();

// Initialize Google Generative AI with the API key
const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({
	model: 'gemini-1.5-flash',
});

// Configuration for AI generation
const generationConfig = {
	temperature: 1,
	topP: 0.95,
	topK: 64,
	maxOutputTokens: 8192,
	responseMimeType: 'text/plain',
};

// Chat session history
let history = [];

// Multer configuration for file uploads
const upload = multer({
	dest: 'uploads/',
	limits: { fileSize: 50 * 1024 * 1024 }, // Limit to 50MB
	fileFilter: (req, file, cb) => {
		const allowedTypes = /text|csv|json|pdf/;
		const mimeTypes = [
			'text/plain',
			'text/csv',
			'application/json',
			'application/pdf',
		];
		const mimeTypeValid = mimeTypes.includes(file.mimetype);
		const extensionValid = allowedTypes.test(
			file.originalname.split('.').pop().toLowerCase()
		);

		if (mimeTypeValid && extensionValid) {
			cb(null, true);
		} else {
			cb(new Error('File type not supported'));
		}
	},
});

// Utility function to generate AI response
const generateResponse = async (question, fileContent, res) => {
	try {
		// Start a new chat session with the model
		const chatSession = model.startChat({
			generationConfig,
			history,
		});

		const message = fileContent ? `${fileContent}\n${question}` : question;
		const result = await chatSession.sendMessageStream(message);

		// Append the user message to history
		history.push({
			role: 'user',
			parts: [{ text: message }],
		});

		// Set up chunked response
		res.setHeader('Content-Type', 'text/plain');
		res.setHeader('Transfer-Encoding', 'chunked');

		// Stream response chunks
		for await (const chunk of result.stream) {
			const chunkText = chunk.text();
			history.push({
				role: 'model',
				parts: [{ text: chunkText }],
			});
			res.write(chunkText); // Write chunk to response
		}

		res.end(); // Close response stream
	} catch (error) {
		console.error('Error during AI response generation:', error);
		res
			.status(500)
			.json({ error: 'An error occurred while processing your request.' });
	}
};

// Routes

// POST: Handle chat with AI and file upload
router.post('/', authLogin, upload.single('file'), async (req, res) => {
	const userQuestion = req.body.question;
	const file = req.file;
	const userId = req.user.id;
	let fileContent = '';

	if (file) {
		try {
			if (file.mimetype === 'application/pdf') {
				const dataBuffer = await fs.readFile(file.path);
				const data = await pdfParse(dataBuffer);
				fileContent = data.text; // Extract text from PDF
			} else {
				fileContent = await fs.readFile(file.path, 'utf-8'); // Read text or JSON files
			}
			await fs.unlink(file.path); // Clean up uploaded file
		} catch (error) {
			console.error('Error reading file:', error);
			return res.status(500).json({ error: 'File processing failed.' });
		}
	}

	await generateResponse(userQuestion, fileContent, res);
});

// POST: Save chat history
router.post('/save-history', authLogin, async (req, res) => {
	const userId = req.user.id;
	const { history } = req.body; // Extract chat history from the request

	if (!history || !Array.isArray(history) || history.length === 0) {
		return res.status(400).json({ error: 'Chat history is invalid or empty.' });
	}

	try {
		const chatSessionId = new Date().getTime().toString(); // Generate unique session ID
		const chatHistory = new ChatHistory({
			userId,
			chatSessionId,
			history,
		});

		await chatHistory.save(); // Save chat history to the database
		res.status(200).json({ msg: 'Chat history saved successfully' });
	} catch (error) {
		console.error('Error saving chat history:', error);
		res.status(500).json({ error: 'Failed to save chat history.' });
	}
});

// GET: Fetch all chat history sessions
router.get('/history', authLogin, async (req, res) => {
	const userId = req.user.id;
	console.log('User ID:', userId);

	try {
		const userChatHistory = await ChatHistory.find({ userId })
			.sort({ createdAt: -1 }) // Sort by most recent first
			.select('chatSessionId createdAt') // Return session ID and creation date
			.limit(20); // Limit to last 20 sessions

		res.status(200).json({ chatHistory: userChatHistory });
	} catch (error) {
		console.error('Error fetching chat history:', error);
		res.status(500).json({ error: 'Failed to retrieve chat history.' });
	}
});

// GET: Fetch history of a specific session
router.get('/history/:sessionId', authLogin, async (req, res) => {
	const userId = req.user.id;
	const { sessionId } = req.params;

	try {
		const session = await ChatHistory.findOne({
			userId,
			chatSessionId: sessionId,
		});

		if (!session) {
			return res.status(404).json({ error: 'Session not found.' });
		}

		res.status(200).json({ history: session.history });
	} catch (error) {
		console.error('Error fetching session history:', error);
		res.status(500).json({ error: 'Failed to retrieve session history.' });
	}
});

module.exports = router;
