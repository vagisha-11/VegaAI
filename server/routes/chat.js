// routes/chat.js
const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const authLogin = require('../middleware/authToken');
const pdfParse = require('pdf-parse');
const geminiApiKey = process.env.GEMINI_API_KEY;
const ChatHistory = require('../models/chatlog.js');

// Initialize Express Router
const router = express.Router();

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

let history = [];

// Function to generate a response for a single question
const generateResponse = async (question, fileContent, res) => {
	try {
		const chatSession = model.startChat({
			generationConfig,
			history: history,
		});

		const message = fileContent ? `${fileContent}\n${question}` : question;

		const result = await chatSession.sendMessageStream(message);
		history.push({
			role: 'user',
			parts: [{ text: message }],
		});

		// Set response headers to enable chunked transfer
		res.setHeader('Content-Type', 'text/plain');
		res.setHeader('Transfer-Encoding', 'chunked');

		// Stream the chunks of text
		for await (const chunk of result.stream) {
			const chunkText = chunk.text();
			history.push({
				role: 'model',
				parts: [{ text: chunkText }],
			});

			// Write chunk to response stream
			res.write(chunkText);
		}

		res.end(); // End the response when streaming is done
	} catch (error) {
		console.error('Error:', error);
		res
			.status(500)
			.json({ error: 'An error occurred while processing your request.' });
	}
};

// POST endpoint to handle chat with streaming
router.post('/', authLogin, upload.single('file'), async (req, res) => {
	const userQuestion = req.body.question;
	const file = req.file;
	let fileContent = '';

	const userId = req.user.id;

	if (file) {
		try {
			if (file.mimetype === 'application/pdf') {
				const dataBuffer = await fs.readFile(file.path);
				const data = await pdfParse(dataBuffer); // Parse the PDF content
				fileContent = data.text; // Extract text from the PDF
			} else {
				fileContent = await fs.readFile(file.path, 'utf-8');
			}
			await fs.unlink(file.path); // Clean up the uploaded file
		} catch (error) {
			console.error('File read error:', error);
			return res.status(500).json({ error: 'File read failed.' });
		}
	}
	await generateResponse(userQuestion, fileContent, res);
});

// New route to save chat history when user leaves the page
router.post('/save-history', authLogin, async (req, res) => {
	const userId = req.user.id;
	const { history } = req.body; // The accumulated chat history will be sent from the client
	console.log('Received chat history:', history);
	if (!history || !Array.isArray(history) || history.length === 0) {
		return res.status(400).json({ error: 'Chat history is invalid or empty.' });
	}

	try {
		const chatSessionId = new Date().getTime().toString(); // Generate a unique session ID
		const chatHistory = new ChatHistory({
			userId,
			chatSessionId,
			history,
		});

		// Save chat history to the database
		await chatHistory.save();
		res.status(200).json({ msg: 'Chat history saved successfully' });
	} catch (error) {
		console.error('Error saving chat history:', error);
		res.status(500).json({ error: 'Failed to save chat history' });
	}
});

module.exports = router;
